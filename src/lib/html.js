export function getSettingsPage(url) {
  return `<!DOCTYPE html>
    <html>
      <head>
        <title>Smart Search Router</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon16.png">
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/icon48.png">
        <link rel="icon" type="image/png" sizes="128x128" href="/icons/icon128.png">
        <link rel="search" 
              type="application/opensearchdescription+xml" 
              title="SmartSearch" 
              href="${url.origin}/opensearch.xml">
        <style>
          body { 
            font-family: system-ui; 
            max-width: 800px; 
            margin: 2rem auto; 
            padding: 0 1rem;
            line-height: 1.6;
            background: #1e1e1e;
            color: #ffffff;
          }
          select { 
            width: 100%; 
            padding: 0.5rem; 
            margin: 0.5rem 0 1rem;
            border: 1px solid #444;
            border-radius: 4px;
            background: #2d2d2d;
            color: #ffffff;
          }
          .container { 
            background: #2d2d2d; 
            padding: 1.5rem; 
            border-radius: 8px;
            margin-bottom: 1rem;
            border: 1px solid #444;
          }
          code {
            background: #3d3d3d;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.9em;
            color: #bb86fc;
          }
          .search-details {
            background: #3d3d3d;
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
          }
          .search-details div {
            margin: 0.5rem 0;
          }
          .search-details label {
            display: inline-block;
            width: 120px;
            color: #bb86fc;
          }
          .method {
            border-left: 3px solid #bb86fc;
            padding-left: 1rem;
            margin: 1rem 0;
          }
          .button {
            display: inline-block;
            padding: 0.5rem 1rem;
            background: #bb86fc;
            color: #000000;
            text-decoration: none;
            border-radius: 4px;
            margin: 0.5rem 0;
          }
          .button:hover {
            background: #9965e3;
          }
        </style>
      </head>
      <body>
        <h1>Smart Search Router</h1>
        
        <div class="container">
          <h2>Settings</h2>
          <label for="keywordEngine">Search Engine for Keywords:</label>
          <select id="keywordEngine">
            <option value="google">Google</option>
            <option value="bing">Bing</option>
            <option value="duckduckgo">DuckDuckGo</option>
          </select>

          <label for="questionEngine">Search Engine for Questions:</label>
          <select id="questionEngine">
            <option value="perplexity">Perplexity</option>
            <option value="google">Google</option>
            <option value="bing">Bing</option>
            <option value="duckduckgo">DuckDuckGo</option>
          </select>
        </div>

        <div class="container">
          <h2>How to Add to Brave/Chrome</h2>
          
          <div class="method">
            <h3>Method 1: Browser Extension (Recommended)</h3>
            <p>Install the SmartSearch extension for the best experience:</p>
            <ol>
              <li>Download and unzip the extension from <a href="https://github.com/levjampolsky/SmartSearch/releases" class="button">GitHub Releases</a></li>
              <li>Go to Chrome/Brave Extensions page (<code>chrome://extensions</code>)</li>
              <li>Enable "Developer mode" in the top right</li>
              <li>Click "Load unpacked" and select the unzipped extension folder</li>
              <li>Once installed, use the keyboard shortcut <code>smart</code> + <code>Tab</code> to use SmartSearch</li>
            </ol>
            <p><strong>Note:</strong> Due to browser security restrictions, the "Make default" option may be grayed out. This is normal - you can still use SmartSearch with the keyboard shortcut.</p>
          </div>

          <div class="method">
            <h3>Method 2: Manual Setup</h3>
            <p>You can add SmartSearch as a search engine:</p>
            <ol>
              <li>Go to Settings → Search engines</li>
              <li>Under "Site Search", click "Add"</li>
              <li>Fill in these details:</li>
              <div class="search-details">
                <div><label>Search engine:</label> <code>SmartSearch</code></div>
                <div><label>Shortcut:</label> <code>smart</code></div>
                <div><label>URL:</label> <code id="searchUrl">${url.origin}/search?q=%s</code></div>
              </div>
              <li>Click "Add"</li>
              <li>Use <code>smart</code> + <code>Tab</code> to search with SmartSearch</li>
            </ol>
          </div>

          <h3>Using SmartSearch</h3>
          <p>After setup:</p>
          <ul>
            <li>Type <code>smart</code> + <code>Tab</code> to use SmartSearch</li>
            <li>Questions like "how to..." or "what is..." will automatically use <span id="defaultQuestionEngine">Perplexity</span></li>
            <li>Regular keywords will use <span id="defaultKeywordEngine">Google</span></li>
          </ul>
        </div>

        <script>
          function updateSettings() {
            const keywordEngine = document.getElementById('keywordEngine').value;
            const questionEngine = document.getElementById('questionEngine').value;
            const searchUrl = \`${url.origin}/search?q=%s&keywordEngine=\${keywordEngine}&questionEngine=\${questionEngine}\`;
            document.getElementById('searchUrl').textContent = searchUrl;
            document.getElementById('defaultQuestionEngine').textContent = questionEngine;
            document.getElementById('defaultKeywordEngine').textContent = keywordEngine;
          }

          document.getElementById('keywordEngine').addEventListener('change', updateSettings);
          document.getElementById('questionEngine').addEventListener('change', updateSettings);
        </script>
      </body>
    </html>`;
} 