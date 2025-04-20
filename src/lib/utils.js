export function isQuestion(query) {
  const q = query.trim().toLowerCase();
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
  
  // Remove potential HTML/script tags
  query = query.replace(/<[^>]*>/g, '');
  
  // Remove potential script injection characters
  query = query.replace(/[<>{}()[\]\\\/]/g, '');
  
  // Remove multiple spaces
  query = query.replace(/\s+/g, ' ');
  
  // Trim and limit length as additional safety
  return query.trim().slice(0, 1000);
}

export function validateCountryCode(code) {
  if (!code || typeof code !== 'string') return 'US';
  
  // Only allow uppercase letters, 2-3 characters
  return /^[A-Z]{2,3}$/.test(code) ? code : 'US';
} 