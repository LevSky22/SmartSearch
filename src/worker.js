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
  const clientIP = request.headers.get('CF-Connecting-IP');
  const key = `${clientIP}:requests`;
  const blockKey = `${clientIP}:blocked`;
  const now = Date.now();
  
  // Add timestamp to keys for cleanup
  const timeKey = `${clientIP}:timestamp`;
  
  // Check if IP is blocked
  const isBlocked = await env.RATE_LIMIT_STORE.get(blockKey);
  if (isBlocked) {
    return new Response('Request could not be processed', { status: 429 });
  }

  // Get current request count
  let count = await env.RATE_LIMIT_STORE.get(key) || 0;
  count = parseInt(count);

  // Get last request timestamp
  const lastRequest = await env.RATE_LIMIT_STORE.get(timeKey) || now;
  
  // If more than 1 minute has passed, reset counter
  if (now - parseInt(lastRequest) > 60000) {
    count = 0;
  }

  if (count >= RATE_LIMIT.REQUESTS_PER_MINUTE) {
    // Block the IP
    await env.RATE_LIMIT_STORE.put(blockKey, 'true', { expirationTtl: RATE_LIMIT.BLOCK_DURATION_SECONDS });
    return new Response('Request could not be processed', { status: 429 });
  }

  // Update counters with TTL
  await env.RATE_LIMIT_STORE.put(key, (count + 1).toString(), { expirationTtl: 60 });
  await env.RATE_LIMIT_STORE.put(timeKey, now.toString(), { expirationTtl: 60 });
  
  return null;
}

async function handleSearch(request, url) {
  let query;
  
  // Validate request method
  if (!['POST', 'GET'].includes(request.method)) {
    return new Response('Method not allowed', { status: 405 });
  }
  
  // Get and validate query
  if (request.method === 'POST') {
    try {
      const formData = await request.formData();
      query = formData.get('q');
    } catch (e) {
      return new Response('Invalid request format', { status: 400 });
    }
  } else {
    query = url.searchParams.get('q');
  }

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
    
    // Verify URL is valid and has expected structure
    const urlObj = new URL(searchUrl);
    if (!urlObj.protocol.startsWith('https')) {
      throw new Error('Invalid protocol');
    }
    
    return Response.redirect(searchUrl, 302);
  } catch (e) {
    return new Response('Request could not be processed', { status: 400 });
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
            if (ALLOWED_ORIGINS.includes(originUrl.origin)) {
              newResponse.headers.set('Access-Control-Allow-Origin', originUrl.origin);
              newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
              newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
              newResponse.headers.set('Access-Control-Max-Age', '86400');
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
       method="post"
       template="${url.origin}/search"/>
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