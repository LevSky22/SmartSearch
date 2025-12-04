export function isQuestion(query) {
  const q = query.trim().toLowerCase();
  
  // Check for currency conversion patterns
  // Handles formats like:
  // - 1000CAD in USD
  // - 1000 CAD to USD
  // - CAD to USD
  // - convert 100 CAD to USD
  // - 50k USD in CAD
  // - 1.5m eur to usd
  const currencyPattern = /^(convert\s+)?(\d+(\.\d+)?[km]?\s+)?[a-z]{3}\s*(in|to|into)\s*[a-z]{3}$/i;
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

export function isMathExpression(query) {
  if (!query || typeof query !== 'string') return false;
  
  // Match simple math expressions like "24/2", "10*5", "100+50", "50-25"
  // Only allow numbers, spaces, and basic operators: +, -, *, /
  const mathPattern = /^\s*(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)\s*$/;
  return mathPattern.test(query.trim());
}

export function sanitizeQuery(query) {
  if (!query || typeof query !== 'string') return '';
  
  // Safety check for maximum query length
  if (query.length > 1000) {
    query = query.slice(0, 1000);
  }
  
  // Remove potential HTML/script tags more aggressively
  query = query.replace(/<[^>]*>?/g, '');
  
  // If it's a math expression, preserve math operators but still remove other dangerous chars
  const isMath = isMathExpression(query);
  
  if (isMath) {
    // For math expressions, only remove dangerous characters but keep +, -, *, /
    query = query.replace(/[<>{}[\]\\;`|&%$^#@!~]/g, '');
  } else {
    // Preserve common search operators that Google supports:
    // ? - question marks (for questions)
    // " - quotes (for exact phrase searches)
    // : - colons (for operators like site:example.com)
    // () - parentheses (for grouping)
    // - - minus (for excluding terms)
    // + - plus (for requiring terms)
    // / - forward slash (for paths, dates, etc.)
    // * - asterisk (for wildcards)
    // = - equals (for some operators)
    // Remove only truly dangerous characters that could cause security issues
    query = query.replace(/[<>{}[\]\\;`|&%$^#@!~]/g, '');
  }
  
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