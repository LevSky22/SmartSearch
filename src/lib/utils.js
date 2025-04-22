export function isQuestion(query) {
  const q = query.trim().toLowerCase();
  
  // Check for currency conversion patterns
  // Handles formats like:
  // - 1000CAD in USD
  // - 1000 CAD to USD
  // - CAD to USD
  // - convert 100 CAD to USD
  // - 100 Canadian dollars in USD
  const currencyPattern = /^(convert\s+)?(\d+\s+)?[a-z]{3}\s*(in|to|into)\s*[a-z]{3}$/i;
  if (currencyPattern.test(q)) {
    return false; // Route to Google
  }

  const questionWords = ["who", "what", "when", "where", "why", "how"];
  return q.endsWith("?") || 
         questionWords.some(w => q.startsWith(w + " ")) || 
         q.split(/\s+/).length > 3;
}

export function getCountryFromRequest(request) {
  return request.headers.get('cf-ipcountry') || 'US';
}

export function sanitizeQuery(query) {
  if (!query || typeof query !== 'string') return '';
  
  // Safety check for maximum query length
  if (query.length > 1000) {
    query = query.slice(0, 1000);
  }
  
  // Remove potential HTML/script tags more aggressively
  query = query.replace(/<[^>]*>?/g, '');
  
  // Remove potential script injection characters and other problematic characters
  query = query.replace(/[<>{}()[\]\\\/;`'"|&*%$^#@!~=+]/g, '');
  
  // Normalize whitespace
  query = query.replace(/\s+/g, ' ');
  
  // Trim and encode special characters
  return query.trim();
}

export function validateCountryCode(code) {
  if (!code || typeof code !== 'string') return 'US';
  
  // Only allow uppercase letters, 2-3 characters
  return /^[A-Z]{2,3}$/.test(code) ? code : 'US';
} 