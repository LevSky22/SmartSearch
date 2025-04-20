import { SEARCH_ENGINES } from './lib/constants';
import { isQuestion, getCountryFromRequest } from './lib/utils';
import { getSettingsPage } from './lib/html';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { securityHeaders } from './lib/security';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      const createResponse = (response) => {
        const newResponse = new Response(response.body, response);
        Object.entries(securityHeaders).forEach(([key, value]) => {
          newResponse.headers.set(key, value);
        });
        return newResponse;
      };

      // Force HTTPS
      if (url.protocol === 'http:') {
        url.protocol = 'https:';
        return Response.redirect(url.toString(), 301);
      }
      
      // Handle static assets (icons)
      if (url.pathname === '/favicon.ico' || url.pathname.includes('/icons/')) {
        try {
          // Remove /assets prefix if present
          const cleanPath = url.pathname.replace('/assets/', '/');
          const assetRequest = new Request(new URL(cleanPath, request.url), request);
          
          return await getAssetFromKV(
            {
              request: assetRequest,
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_MANIFEST: assetManifest,
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
            }
          );
        } catch (e) {
          return new Response('Internal Server Error', { status: 500 });
        }
      }

      // Handle OpenSearch description document
      if (url.pathname === '/opensearch.xml') {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>
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
</OpenSearchDescription>`,
          {
            headers: {
              'Content-Type': 'application/opensearchdescription+xml',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }

      // Handle search requests
      if (url.pathname === '/search') {
        const query = url.searchParams.get('q');
        if (!query) {
          return new Response('No query provided', { status: 400 });
        }

        const keywordEngine = url.searchParams.get('keywordEngine') || 'google';
        const questionEngine = url.searchParams.get('questionEngine') || 'perplexity';
        const selectedEngine = isQuestion(query) ? questionEngine : keywordEngine;
        const countryCode = getCountryFromRequest(request);
        
        const searchUrl = SEARCH_ENGINES[selectedEngine](
          encodeURIComponent(query),
          countryCode
        );

        return Response.redirect(searchUrl, 302);
      }

      // Handle suggestion requests
      if (url.pathname === '/suggest') {
        const query = url.searchParams.get('q') || '';
        // For now, return basic suggestions
        return new Response(JSON.stringify([
          query,
          [query + " example", query + " help", query + " guide"],
          ["Try this!", "Maybe this?", "Or this?"],
          ["https://example.com", "https://example.com", "https://example.com"]
        ]), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
          }
        });
      }

      // Serve the homepage/settings
      return new Response(getSettingsPage(url), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Link': '<favicon.ico>; rel="icon"'
        },
      });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  },
}; 