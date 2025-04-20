import { SEARCH_ENGINES, GOOGLE_DOMAINS } from './lib/constants';
import { isQuestion, getCountryFromRequest, sanitizeQuery, validateCountryCode } from './lib/utils';
import { getSettingsPage } from './lib/html';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { securityHeaders } from './lib/security';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);
const ALLOWED_ORIGINS = ['https://smartsearch.lev-jampolsky.workers.dev'];
const MAX_QUERY_LENGTH = 1000;

// Rate limiting configuration
const RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 100,
  BLOCK_DURATION_SECONDS: 3600 // 1 hour block
};

// KV namespace for rate limiting
const KV_NAMESPACE = 'RATE_LIMIT_STORE';

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
  // Get client IP and add Cloudflare client fingerprint if available for better identification
  const clientIP = request.headers.get('CF-Connecting-IP');
  const cfFingerprint = request.headers.get('CF-Client-IP-Fingerprint') || '';
  const userAgent = request.headers.get('User-Agent') || '';
  
  // Use a more unique identifier combining available data
  const clientId = `${clientIP}:${cfFingerprint.slice(0, 10)}`;
  const key = `${clientId}:requests`;
  const blockKey = `${clientId}:blocked`;
  const now = Date.now();
  
  // Timestamp window
  const windowSize = 60000; // 1 minute in milliseconds
  const timeKey = `${clientId}:timestamps`;
  
  // Check if IP is blocked
  const isBlocked = await env.RATE_LIMIT_STORE.get(blockKey);
  if (isBlocked) {
    return new Response('Rate limit exceeded', { 
      status: 429,
      headers: {
        'Retry-After': '3600'
      }
    });
  }

  try {
    // Get timestamps of previous requests in window
    let timestamps = await env.RATE_LIMIT_STORE.get(timeKey);
    timestamps = timestamps ? JSON.parse(timestamps) : [];
    
    // Filter out timestamps outside current window
    const validTimestamps = timestamps.filter(ts => (now - ts) < windowSize);
    
    // Add current timestamp
    validTimestamps.push(now);
    
    // Check if limit exceeded
    if (validTimestamps.length > RATE_LIMIT.REQUESTS_PER_MINUTE) {
      // Block the client ID
      await env.RATE_LIMIT_STORE.put(blockKey, 'true', { expirationTtl: RATE_LIMIT.BLOCK_DURATION_SECONDS });
      return new Response('Rate limit exceeded', { 
        status: 429,
        headers: {
          'Retry-After': RATE_LIMIT.BLOCK_DURATION_SECONDS.toString()
        }
      });
    }
    
    // Update timestamps list with TTL
    await env.RATE_LIMIT_STORE.put(timeKey, JSON.stringify(validTimestamps), { expirationTtl: 120 });
    
    return null;
  } catch (e) {
    // If KV fails, default to allowing the request to avoid breaking functionality
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

          return createResponse(response);
        } catch (e) {
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
          return createResponse(new Response('Request could not be processed', { 
            status: 500,
            statusText: 'Error',
            headers: {
              'Content-Type': 'text/plain',
              'Cache-Control': 'no-store'
            }
          }));
        }
      }

      // Serve the homepage/settings
      return createResponse(new Response(getSettingsPage(url), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Link': '<favicon.ico>; rel="icon"'
        }
      }));
    } catch (error) {
      return new Response('Request could not be processed', { 
        status: 500,
        statusText: 'Error',
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store'
        }
      });
    }
  }
}; 