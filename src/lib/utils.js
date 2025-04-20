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