# 🔍 Smart Search Router

A browser extension for Chromium-based browsers that intelligently routes your searches between your preferred search engines based on your query type.

## 🎥 Demo
![Smart Search Router Demo](SmartSearch.gif)

## ✨ Features

- Choose your preferred search engines for both questions and keywords
- Supported search engines:
  - Google (with locale-specific domains)
  - Perplexity
- Seamless integration with your browser's address bar
- Lightweight and fast
- Settings sync across devices

## 🚀 Installation

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

## 📖 Usage

1. Click the extension icon to configure your preferred search engines
2. Type `smart` in your address bar followed by a space
3. Enter your search query:
   - For questions: `smart what is the capital of France?`
   - For keywords: `smart best restaurants nyc`
4. Press Enter to be redirected to your chosen search engine

## ⚙️ Configuration

1. Click the extension icon in your browser toolbar
2. You'll see two dropdown menus:
   - "Search Engine for Keywords": Select your preferred engine for regular searches
   - "Search Engine for Questions": Select your preferred engine for questions
3. Changes are saved automatically and sync across your devices
4. Default settings:
   - Keywords: Google (with locale-specific domains)
   - Questions: Perplexity

## 🔒 Privacy

- No search queries are collected or stored by this extension
- Country detection is handled securely through Cloudflare's infrastructure
- For search results, standard search engine Privacy Policies apply
- The extension requires minimal permissions:
  - `storage`: To save your search engine preferences

## 👥 Contributing

Feel free to submit issues and pull requests.

## 📄 License

MIT License - feel free to use and modify as needed.

## 🙏 Credits

Matryoshka icon provided by [Icojam.com](https://icojam.com)

*This is totally vibe-coded by the way. Including this README.*