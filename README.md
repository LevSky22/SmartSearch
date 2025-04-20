# Smart Search Router

A browser extension for Chromium-based browsers that intelligently routes your searches between Perplexity and Google based on your query type.

## Features

- Use the `x` keyword in your browser's omnibox (address bar) to activate the extension
- Natural language questions are routed to Perplexity AI
- Keyword-based searches are routed to Google
- Seamless integration with your browser's address bar
- Lightweight and fast

## Installation

### Chrome
1. Clone this repository or download the ZIP file
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

### Brave
1. Clone this repository or download the ZIP file
2. Open Brave and go to `brave://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Type `x` in Chrome's address bar followed by a space
2. Enter your search query:
   - For questions: `x what is the capital of France?`
   - For keywords: `x best restaurants nyc`
3. Press Enter to be redirected to the appropriate search engine

## Privacy

- No search queries are collected or stored by this extension
- The only external service used is ipapi.co, which helps determine the appropriate Google domain for your region
- ipapi.co is GDPR compliant, adhering to Europe's stringent privacy laws
- For search results, standard Google and Perplexity Privacy Policies apply
- The extension requires minimal permissions:
  - `tabs`: To open search results in new tabs
  - Access to ipapi.co for location-based features

## Contributing

Feel free to submit issues and pull requests.

## License

MIT License - feel free to use and modify as needed. 

*This is totally vibe-coded by the way. Including this README.*