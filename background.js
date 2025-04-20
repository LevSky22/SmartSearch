// background.js

// Google domain mapping for common locales
const GOOGLE_DOMAINS = {
  'AD': 'google.ad',
  'AE': 'google.ae',
  'AF': 'google.com.af',
  'AG': 'google.com.ag',
  'AL': 'google.al',
  'AM': 'google.am',
  'AO': 'google.co.ao',
  'AR': 'google.com.ar',
  'AS': 'google.as',
  'AT': 'google.at',
  'AU': 'google.com.au',
  'AZ': 'google.az',
  'BA': 'google.ba',
  'BD': 'google.com.bd',
  'BE': 'google.be',
  'BF': 'google.bf',
  'BG': 'google.bg',
  'BH': 'google.com.bh',
  'BI': 'google.bi',
  'BJ': 'google.bj',
  'BN': 'google.com.bn',
  'BO': 'google.com.bo',
  'BR': 'google.com.br',
  'BS': 'google.bs',
  'BT': 'google.bt',
  'BW': 'google.co.bw',
  'BY': 'google.by',
  'BZ': 'google.com.bz',
  'CA': 'google.ca',
  'CD': 'google.cd',
  'CF': 'google.cf',
  'CG': 'google.cg',
  'CH': 'google.ch',
  'CI': 'google.ci',
  'CK': 'google.co.ck',
  'CL': 'google.cl',
  'CM': 'google.cm',
  'CN': 'google.cn',
  'CO': 'google.com.co',
  'CR': 'google.co.cr',
  'CU': 'google.com.cu',
  'CV': 'google.cv',
  'CY': 'google.com.cy',
  'CZ': 'google.cz',
  'DE': 'google.de',
  'DJ': 'google.dj',
  'DK': 'google.dk',
  'DM': 'google.dm',
  'DO': 'google.com.do',
  'DZ': 'google.dz',
  'EC': 'google.com.ec',
  'EE': 'google.ee',
  'EG': 'google.com.eg',
  'ES': 'google.es',
  'ET': 'google.com.et',
  'FI': 'google.fi',
  'FJ': 'google.com.fj',
  'FM': 'google.fm',
  'FR': 'google.fr',
  'GA': 'google.ga',
  'GE': 'google.ge',
  'GG': 'google.gg',
  'GH': 'google.com.gh',
  'GI': 'google.com.gi',
  'GL': 'google.gl',
  'GM': 'google.gm',
  'GR': 'google.gr',
  'GT': 'google.com.gt',
  'GY': 'google.gy',
  'HK': 'google.com.hk',
  'HN': 'google.hn',
  'HR': 'google.hr',
  'HT': 'google.ht',
  'HU': 'google.hu',
  'ID': 'google.co.id',
  'IE': 'google.ie',
  'IL': 'google.co.il',
  'IM': 'google.im',
  'IN': 'google.co.in',
  'IQ': 'google.iq',
  'IS': 'google.is',
  'IT': 'google.it',
  'JE': 'google.je',
  'JM': 'google.com.jm',
  'JO': 'google.jo',
  'JP': 'google.co.jp',
  'KE': 'google.co.ke',
  'KH': 'google.com.kh',
  'KI': 'google.ki',
  'KG': 'google.kg',
  'KR': 'google.co.kr',
  'KW': 'google.com.kw',
  'KZ': 'google.kz',
  'LA': 'google.la',
  'LB': 'google.com.lb',
  'LI': 'google.li',
  'LK': 'google.lk',
  'LS': 'google.co.ls',
  'LT': 'google.lt',
  'LU': 'google.lu',
  'LV': 'google.lv',
  'LY': 'google.com.ly',
  'MA': 'google.co.ma',
  'MD': 'google.md',
  'ME': 'google.me',
  'MG': 'google.mg',
  'MK': 'google.mk',
  'ML': 'google.ml',
  'MM': 'google.com.mm',
  'MN': 'google.mn',
  'MT': 'google.com.mt',
  'MU': 'google.mu',
  'MV': 'google.mv',
  'MW': 'google.mw',
  'MX': 'google.com.mx',
  'MY': 'google.com.my',
  'MZ': 'google.co.mz',
  'NA': 'google.com.na',
  'NG': 'google.com.ng',
  'NI': 'google.com.ni',
  'NE': 'google.ne',
  'NL': 'google.nl',
  'NO': 'google.no',
  'NP': 'google.com.np',
  'NR': 'google.nr',
  'NU': 'google.nu',
  'NZ': 'google.co.nz',
  'OM': 'google.com.om',
  'PA': 'google.com.pa',
  'PE': 'google.com.pe',
  'PG': 'google.com.pg',
  'PH': 'google.com.ph',
  'PK': 'google.com.pk',
  'PL': 'google.pl',
  'PN': 'google.pn',
  'PR': 'google.com.pr',
  'PS': 'google.ps',
  'PT': 'google.pt',
  'PY': 'google.com.py',
  'QA': 'google.com.qa',
  'RO': 'google.ro',
  'RS': 'google.rs',
  'RU': 'google.ru',
  'RW': 'google.rw',
  'SA': 'google.com.sa',
  'SB': 'google.com.sb',
  'SC': 'google.sc',
  'SE': 'google.se',
  'SG': 'google.com.sg',
  'SH': 'google.sh',
  'SI': 'google.si',
  'SK': 'google.sk',
  'SL': 'google.com.sl',
  'SN': 'google.sn',
  'SO': 'google.so',
  'SM': 'google.sm',
  'SR': 'google.sr',
  'ST': 'google.st',
  'SV': 'google.com.sv',
  'TD': 'google.td',
  'TG': 'google.tg',
  'TH': 'google.co.th',
  'TJ': 'google.com.tj',
  'TL': 'google.tl',
  'TM': 'google.tm',
  'TN': 'google.tn',
  'TO': 'google.to',
  'TR': 'google.com.tr',
  'TT': 'google.tt',
  'TW': 'google.com.tw',
  'TZ': 'google.co.tz',
  'UA': 'google.com.ua',
  'UG': 'google.co.ug',
  'UK': 'google.co.uk',
  'US': 'google.com',
  'UY': 'google.com.uy',
  'UZ': 'google.co.uz',
  'VC': 'google.com.vc',
  'VE': 'google.co.ve',
  'VI': 'google.co.vi',
  'VN': 'google.com.vn',
  'VU': 'google.vu',
  'WS': 'google.ws',
  'ZA': 'google.co.za',
  'ZM': 'google.co.zm',
  'ZW': 'google.co.zw',
  'CAT': 'google.cat'
};

// Simple heuristic: question words or trailing '?' or >3 words
function isQuestion(query) {
  const q = query.trim().toLowerCase();
  const questionWords = ["who", "what", "when", "where", "why", "how"];
  const startsWithQ = questionWords.some(w => q.startsWith(w + " "));
  return q.endsWith("?") || startsWithQ || q.split(/\s+/).length > 3;
}

let cachedCountry = null;

async function getCountryCode() {
  if (cachedCountry) return cachedCountry;
  
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    cachedCountry = data.country_code;
    return cachedCountry;
  } catch (error) {
    console.error('Error getting location:', error);
    return 'US'; // fallback
  }
}

function getGoogleDomain(countryCode) {
  return GOOGLE_DOMAINS[countryCode] || 'google.com';
}

const SEARCH_ENGINES = {
  google: (query, countryCode) => {
    const domain = getGoogleDomain(countryCode);
    return `https://www.${domain}/search?q=${query}&gl=${countryCode}`;
  },
  bing: (query) => `https://www.bing.com/search?q=${query}`,
  duckduckgo: (query) => `https://duckduckgo.com/?q=${query}`,
  perplexity: (query) => `https://www.perplexity.ai/search?q=${query}`
};

chrome.omnibox.onInputEntered.addListener(async (query) => {
  const encoded = encodeURIComponent(query);
  const countryCode = await getCountryCode();
  
  // Get user preferences
  const { keywordEngine = 'google', questionEngine = 'perplexity' } = 
    await chrome.storage.sync.get(['keywordEngine', 'questionEngine']);
  
  const selectedEngine = isQuestion(query) ? questionEngine : keywordEngine;
  const url = SEARCH_ENGINES[selectedEngine](encoded, countryCode);
  
  chrome.tabs.create({ url });
});