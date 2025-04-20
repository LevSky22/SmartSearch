import { SEARCH_ENGINES } from './lib/constants';
import { isQuestion, getCountryFromRequest } from './lib/utils';
import { getSettingsPage } from './lib/html';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { securityHeaders } from './lib/security';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);
const ALLOWED_ORIGINS = ['https://smartsearch.lev-jampolsky.workers.dev'];

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
        if (origin && ALLOWED_ORIGINS.includes(origin)) {
          newResponse.headers.set('Access-Control-Allow-Origin', origin);
          newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
          newResponse.headers.set('Access-Control-Max-Age', '86400');
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
      if (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.ico' || url.pathname.includes('/icons/')) {
        try {
          const options = {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
            cacheControl: {
              browserTTL: 31536000,
              edgeTTL: 31536000,
            },
          };

          // Create a new request with the correct path
          let assetPath = url.pathname;
          if (assetPath.startsWith('/assets/')) {
            assetPath = assetPath.replace('/assets/', '/');
          }
          
          const assetUrl = new URL(assetPath, url.origin);
          const assetRequest = new Request(assetUrl.toString(), request);
          
          console.log('Fetching asset:', assetPath);
          
          const asset = await getAssetFromKV({
            request: assetRequest,
            waitUntil: ctx.waitUntil.bind(ctx)
          }, options);

          // Set correct content type
          const contentType = getContentType(url.pathname);
          const response = new Response(asset.body, asset);
          response.headers.set('Content-Type', contentType);
          response.headers.set('Cache-Control', 'public, max-age=31536000');

          return createResponse(response);
        } catch (e) {
          console.error('Asset error:', e.stack || e.message);
          return createResponse(new Response('Not Found', { status: 404 }));
        }
      }

      // Rate limiting for API endpoints
      if (url.pathname === '/search' || url.pathname === '/suggest') {
        const ip = request.headers.get('cf-connecting-ip');
        const country = request.cf?.country || 'XX';
        const colo = request.cf?.colo || 'XXX';
        const rateLimitKey = `ratelimit:${ip}:${country}:${colo}`;
        
        let count = await env.RATE_LIMITS.get(rateLimitKey);
        count = count ? parseInt(count) : 0;
        
        if (count > 2000) {
          return createResponse(new Response('Too Many Requests', { 
            status: 429,
            headers: { 'Retry-After': '86400' }
          }));
        }
        
        await env.RATE_LIMITS.put(rateLimitKey, count + 1, {
          expirationTtl: 86400
        });
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
  <Contact>admin@example.com</Contact>
  <Image width="16" height="16" type="image/png">${url.origin}/icons/icon16.png</Image>
  <Image width="48" height="48" type="image/png">${url.origin}/icons/icon48.png</Image>
  <Image width="128" height="128" type="image/png">${url.origin}/icons/icon128.png</Image>
  <Url type="text/html" 
       method="get"
       template="${url.origin}/search?q={searchTerms}"/>
  <Url type="application/x-suggestions+json"
       method="get"
       template="${url.origin}/suggest?q={searchTerms}"/>
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
        const query = url.searchParams.get('q');
        if (!query) {
          return createResponse(new Response('Bad Request: Missing query parameter', { status: 400 }));
        }

        const keywordEngine = url.searchParams.get('keywordEngine') || 'google';
        const questionEngine = url.searchParams.get('questionEngine') || 'perplexity';
        const selectedEngine = isQuestion(query) ? questionEngine : keywordEngine;
        const countryCode = getCountryFromRequest(request);
        
        const searchUrl = SEARCH_ENGINES[selectedEngine](
          encodeURIComponent(query.trim()),
          countryCode
        );

        return Response.redirect(searchUrl, 302);
      }

      // Handle suggestion requests
      if (url.pathname === '/suggest') {
        const query = url.searchParams.get('q')?.trim() || '';
        if (!query) {
          return createResponse(new Response('[]', {
            headers: { 'Content-Type': 'application/json' }
          }));
        }

        return createResponse(new Response(JSON.stringify([
          query,
          [query + " example", query + " help", query + " guide"],
          ["Try this!", "Maybe this?", "Or this?"],
          ["https://example.com", "https://example.com", "https://example.com"]
        ]), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }));
      }

      // Serve the homepage/settings
      return createResponse(new Response(getSettingsPage(url), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Link': '<favicon.ico>; rel="icon"'
        },
      }));
    } catch (error) {
      console.error('Server error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
}; 