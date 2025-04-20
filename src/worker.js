import { SEARCH_ENGINES, GOOGLE_DOMAINS } from './lib/constants';
import { isQuestion, getCountryFromRequest, sanitizeQuery, validateCountryCode } from './lib/utils';
import { getSettingsPage } from './lib/html';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { securityHeaders } from './lib/security';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);
const ALLOWED_ORIGINS = ['https://smartsearch.lev-jampolsky.workers.dev', 'https://smartsearch.fyi'];
const MAX_QUERY_LENGTH = 1000;

// Rate limiting configuration
const RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 100,
  BLOCK_DURATION_SECONDS: 3600 // 1 hour block
};

// KV namespace for rate limiting
const KV_NAMESPACE = 'RATE_LIMIT_STORE';

// Create a generic error response that doesn't leak sensitive information
function createErrorResponse(status, publicMessage = 'Request could not be processed') {
  return new Response(publicMessage, { 
    status: status,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store'
    }
  });
}

// Validate request basics before processing
function validateRequest(request) {
  // Check request size (prevent DOS via large requests)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 10000) {
    return createErrorResponse(413, 'Payload too large');
  }
  
  // Check for required headers
  if (!request.headers.get('host')) {
    return createErrorResponse(400, 'Missing host header');
  }

  // Check for suspicious user-agent patterns (basic bot detection)
  const userAgent = request.headers.get('user-agent') || '';
  if (userAgent.includes('bot') && 
      !userAgent.includes('googlebot') && 
      !userAgent.includes('bingbot') && 
      !userAgent.includes('yandexbot')) {
    // Don't reveal why it was blocked, just slow the response
    return new Promise(resolve => {
      setTimeout(() => resolve(createErrorResponse(403)), 2000);
    });
  }
  
  return null;
}

// Helper function to determine content type
function getContentType(pathname) {
  const extension = pathname.split('.').pop().toLowerCase();
  const types = {
    'css': 'text/css; charset=utf-8',
    'png': 'image/png',
    'ico': 'image/x-icon',
    'xml': 'application/xml',
    'html': 'text/html; charset=utf-8',
    'json': 'application/json'
  };
  return types[extension] || 'text/plain';
}

async function checkRateLimit(request, env) {
  // Skip rate limiting if KV store isn't available
  if (!env.RATE_LIMIT_STORE) {
    console.warn('Rate limiting store not available');
    return null;
  }

  try {
    // Get client IP and add Cloudflare client fingerprint if available for better identification
    const clientIP = request.headers.get('CF-Connecting-IP');
    if (!clientIP) {
      console.warn('Client IP not available for rate limiting');
      return null; // Can't rate limit without IP
    }

    // Add additional client identifiers to prevent single-IP distributed attacks
    const cfFingerprint = request.headers.get('CF-Client-IP-Fingerprint') || '';
    const userAgent = request.headers.get('User-Agent') || '';
    const acceptLang = request.headers.get('Accept-Language') || '';
    
    // Create a fingerprint from available data
    const fingerprintData = [
      cfFingerprint.slice(0, 10),
      userAgent.length > 0 ? userAgent.slice(0, 5) : '', 
      acceptLang.length > 0 ? acceptLang.slice(0, 2) : ''
    ].filter(Boolean).join(':');
    
    // Use a more unique identifier combining available data
    const clientId = `${clientIP}:${fingerprintData}`;
    // Hash the clientId if you have access to a crypto library
    
    const key = `${clientId}:requests`;
    const blockKey = `${clientId}:blocked`;
    const now = Date.now();
    
    // Timestamp window
    const windowSize = 60000; // 1 minute in milliseconds
    const timeKey = `${clientId}:timestamps`;
    
    // Check if IP is blocked with simple error handling
    let isBlocked;
    try {
      isBlocked = await env.RATE_LIMIT_STORE.get(blockKey);
    } catch (e) {
      console.error('Error checking block status:', e);
      // Fail open with a warning
      return null;
    }
    
    if (isBlocked) {
      return createErrorResponse(429, 'Rate limit exceeded');
    }

    // Get timestamps of previous requests in window with error handling
    let timestamps;
    try {
      const rawTimestamps = await env.RATE_LIMIT_STORE.get(timeKey);
      timestamps = rawTimestamps ? JSON.parse(rawTimestamps) : [];
      
      // Validate timestamps to prevent JSON injection
      if (!Array.isArray(timestamps)) {
        timestamps = [];
      }
    } catch (e) {
      console.error('Error retrieving timestamps:', e);
      timestamps = [];
    }
    
    // Filter out timestamps outside current window and ensure they're numbers
    const validTimestamps = timestamps
      .filter(ts => typeof ts === 'number' && !isNaN(ts))
      .filter(ts => (now - ts) < windowSize);
    
    // Add current timestamp
    validTimestamps.push(now);
    
    // Check if limit exceeded
    if (validTimestamps.length > RATE_LIMIT.REQUESTS_PER_MINUTE) {
      // Block the client ID
      try {
        await env.RATE_LIMIT_STORE.put(blockKey, 'true', { 
          expirationTtl: RATE_LIMIT.BLOCK_DURATION_SECONDS 
        });
      } catch (e) {
        console.error('Error setting block status:', e);
      }
      
      return createErrorResponse(429, 'Rate limit exceeded');
    }
    
    // Update timestamps list with TTL
    try {
      await env.RATE_LIMIT_STORE.put(timeKey, JSON.stringify(validTimestamps), { 
        expirationTtl: 120 
      });
    } catch (e) {
      console.error('Error saving timestamps:', e);
    }
    
    return null;
  } catch (e) {
    // If anything fails, log and allow the request
    console.error('Rate limiting error:', e);
    return null;
  }
}

async function handleSearch(request, url) {
  let query;
  
  // Only accept GET requests
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  // Get and validate query
  query = url.searchParams.get('q');

  // Sanitize and validate query
  query = sanitizeQuery(query);
  
  if (!query || query.length === 0 || query.length > MAX_QUERY_LENGTH) {
    return new Response('Invalid query length', { status: 400 });
  }

  // Validate and sanitize search engine parameters
  const allowedEngines = ['google', 'perplexity'];
  const keywordEngine = allowedEngines.includes(url.searchParams.get('keywordEngine')) 
    ? url.searchParams.get('keywordEngine') 
    : 'google';
  const questionEngine = allowedEngines.includes(url.searchParams.get('questionEngine'))
    ? url.searchParams.get('questionEngine')
    : 'perplexity';

  // Validate country code
  const rawCountryCode = getCountryFromRequest(request);
  const countryCode = validateCountryCode(rawCountryCode);

  const selectedEngine = isQuestion(query) ? questionEngine : keywordEngine;
  
  // Validate final URL construction
  try {
    const searchUrl = SEARCH_ENGINES[selectedEngine](
      encodeURIComponent(query),
      countryCode
    );
    
    // Enhanced URL validation
    const urlObj = new URL(searchUrl);
    
    // Verify URL is valid and has expected structure
    if (!urlObj.protocol.startsWith('https')) {
      throw new Error('Invalid protocol');
    }
    
    // Validate against known safe domains
    const safeDomains = [
      'google.com', 'perplexity.ai',
      ...Object.values(GOOGLE_DOMAINS).map(domain => domain.toLowerCase())
    ];
    
    // Extract base domain for validation
    const hostname = urlObj.hostname.toLowerCase();
    const isValidDomain = safeDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    if (!isValidDomain) {
      throw new Error('Invalid domain in redirect URL');
    }
    
    // Ensure query parameter is properly set
    if (!urlObj.searchParams.has('q')) {
      throw new Error('Missing query parameter in redirect URL');
    }
    
    return Response.redirect(searchUrl, 302);
  } catch (e) {
    return new Response(`Invalid search request: ${e.message}`, { 
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      // Basic request validation first
      const validationError = validateRequest(request);
      if (validationError) return validationError;
      
      const url = new URL(request.url);
      const origin = request.headers.get('Origin');
      
      const createResponse = (response) => {
        const newResponse = new Response(response.body, response);
        Object.entries(securityHeaders).forEach(([key, value]) => {
          newResponse.headers.set(key, value);
        });
        
        // Strict origin validation
        if (origin) {
          try {
            const originUrl = new URL(origin);
            // Use exact string comparison for origins
            if (ALLOWED_ORIGINS.includes(originUrl.origin) && originUrl.origin === originUrl.toString()) {
              newResponse.headers.set('Access-Control-Allow-Origin', originUrl.origin);
              newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
              newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
              newResponse.headers.set('Access-Control-Max-Age', '86400');
              newResponse.headers.set('Vary', 'Origin');
            }
          } catch (e) {
            // Invalid origin, don't set CORS headers
          }
        }
        return newResponse;
      };

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return createResponse(new Response(null, { status: 204 }));
      }

      // Force HTTPS
      if (url.protocol === 'http:') {
        url.protocol = 'https:';
        return Response.redirect(url.toString(), 301);
      }

      // Handle static assets
      if (url.pathname.startsWith('/assets/') || 
          url.pathname.includes('/icons/') || 
          url.pathname === '/.well-known/security.txt') {
        try {
          // Validate asset path - prevent path traversal
          if (url.pathname.includes('..') || url.pathname.includes('%2e%2e') || url.pathname.includes('./')) {
            return createResponse(new Response('Invalid asset path', { status: 403 }));
          }
          
          // Validate file extension against allowed types
          const extension = url.pathname.split('.').pop().toLowerCase();
          const allowedExtensions = ['css', 'png', 'ico', 'xml', 'txt', 'json', 'html', 'js'];
          if (!allowedExtensions.includes(extension)) {
            return createResponse(new Response('Invalid file type', { status: 403 }));
          }
          
          const options = {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
            cacheControl: {
              browserTTL: 31536000,
              edgeTTL: 31536000,
            },
          };

          let assetPath = url.pathname;
          if (assetPath.startsWith('/assets/')) {
            assetPath = assetPath.replace('/assets/', '/');
          }
          
          const assetUrl = new URL(assetPath, url.origin);
          const assetRequest = new Request(assetUrl.toString(), request);
          
          const asset = await getAssetFromKV({
            request: assetRequest,
            waitUntil: ctx.waitUntil.bind(ctx)
          }, options);

          const contentType = getContentType(url.pathname);
          const response = new Response(asset.body, asset);
          response.headers.set('Content-Type', contentType);
          response.headers.set('Cache-Control', 'public, max-age=31536000');
          
          // Add security headers for JavaScript files
          if (extension === 'js') {
            response.headers.set('X-Content-Type-Options', 'nosniff');
          }

          return createResponse(response);
        } catch (e) {
          console.error('Asset error:', e);
          return createResponse(new Response('Resource not available', { status: 404 }));
        }
      }

      // Handle OpenSearch description document
      if (url.pathname === '/opensearch.xml') {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/"
                      xmlns:moz="http://www.mozilla.org/2006/browser/search/">
  <ShortName>SmartSearch</ShortName>
  <Description>Smart search router that automatically chooses the best search engine based on your query</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <OutputEncoding>UTF-8</OutputEncoding>
  <Language>en-US</Language>
  <Image width="16" height="16" type="image/png">${url.origin}/icons/icon16.png</Image>
  <Image width="48" height="48" type="image/png">${url.origin}/icons/icon48.png</Image>
  <Image width="128" height="128" type="image/png">${url.origin}/icons/icon128.png</Image>
  <Url type="text/html" 
       method="get"
       template="${url.origin}/search?q={searchTerms}"/>
  <moz:SearchForm>${url.origin}</moz:SearchForm>
  <Developer>Lev Jampolsky</Developer>
  <Attribution>Search results provided by various engines</Attribution>
  <SyndicationRight>open</SyndicationRight>
  <AdultContent>false</AdultContent>
</OpenSearchDescription>`;
        return createResponse(new Response(xml, {
          headers: { 'Content-Type': 'application/opensearchdescription+xml' }
        }));
      }

      // Handle search requests
      if (url.pathname === '/search') {
        try {
          const rateLimit = await checkRateLimit(request, env);
          if (rateLimit) {
            return rateLimit;
          }
          const searchResponse = await handleSearch(request, url);
          return createResponse(searchResponse);
        } catch (error) {
          console.error('Search error:', error);
          return createResponse(createErrorResponse(500));
        }
      }

      // Serve the homepage/settings (without SRI)
      return createResponse(new Response(getSettingsPage(url), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Link': '<favicon.ico>; rel="icon"',
          'Content-Security-Policy': "default-src 'self'; img-src 'self'; style-src 'self'"
        }
      }));
    } catch (error) {
      // Log the error but don't expose details in the response
      console.error('Unhandled error:', error);
      return createErrorResponse(500);
    }
  }
}; 