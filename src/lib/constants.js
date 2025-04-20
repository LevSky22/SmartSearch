export const GOOGLE_DOMAINS = {
  'US': 'google.com',
  'UK': 'google.co.uk',
  // Add more as needed
};

export const SEARCH_ENGINES = {
  google: (query, countryCode = 'US') => {
    const domain = GOOGLE_DOMAINS[countryCode] || 'google.com';
    return `https://www.${domain}/search?q=${query}&gl=${countryCode}`;
  },
  bing: (query) => `https://www.bing.com/search?q=${query}`,
  duckduckgo: (query) => `https://duckduckgo.com/?q=${query}`,
  perplexity: (query) => `https://www.perplexity.ai/search?q=${query}`
}; 