export function getSettingsPage(url) {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Smart Search Router</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/icon16.png">
    <link rel="icon" type="image/png" sizes="48x48" href="/assets/icons/icon48.png">
    <link rel="icon" type="image/png" sizes="128x128" href="/assets/icons/icon128.png">
    <link rel="search" 
          type="application/opensearchdescription+xml" 
          title="SmartSearch" 
          href="${url.origin}/opensearch.xml">
    <link rel="stylesheet" href="/assets/styles.css">
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

      <div class="privacy-notice">
        <strong>Privacy Notice</strong>
        <ul>
          <li>This service does not store any logs or personal data</li>
          <li>Queries are processed securely using HTTPS</li>
          <li>No cookies or tracking mechanisms are used</li>
          <li>Note: The target search engine will still see your query and may track it, but nothing is stored on this worker and I have no idea on your queries</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>Made with ❤️ (and a lot of help from Claude 3.7 and o4-mini-high) by <a href="https://x.com/LevJampolsky" target="_blank">@LevJampolsky</a></p>
    </div>
</body>
</html>`;
} 