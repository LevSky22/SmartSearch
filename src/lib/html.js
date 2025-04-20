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
          .footer {
            text-align: center;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #444;
          }
        </style>
      </head>
      <body>
        <h1>Smart Search Router</h1>
        
        <div class="container">
          <h2>How to Add to Brave/Chrome</h2>
          
          <div class="method">
            <h3>Browser Extension Setup</h3>
            <p>Install the SmartSearch extension:</p>
            <ol>
              <li>Download and unzip the extension from <a href="https://github.com/LevSky22/SmartSearch/releases" class="button">GitHub Releases</a></li>
              <li>Go to Chrome/Brave Extensions page (<code>chrome://extensions</code>)</li>
              <li>Enable "Developer mode" in the top right</li>
              <li>Click "Load unpacked" and select the unzipped extension folder</li>
            </ol>
            <p>Once installed, SmartSearch will automatically become your default search engine.</p>
          </div>

          <h3>Using SmartSearch</h3>
          <p>After installation:</p>
          <ul>
            <li>Just use your browser's search bar or address bar to search</li>
            <li>Questions like "how to..." or "what is..." will automatically use Perplexity</li>
            <li>Regular keywords will use Google</li>
          </ul>
        </div>

        <div class="footer">
          <p>Made with ❤️ (and a lot of help from Claude 3.7 and o4-mini-high) by <a href="https://x.com/LevJampolsky" target="_blank" style="color: #bb86fc;">@LevJampolsky</a></p>
        </div>
      </body>
    </html>`;
} 