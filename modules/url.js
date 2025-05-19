/**
 * URL parsing and analysis functionality
 */

/**
 * Parse URL into components
 */
export function parseURL(url) {
  try {
    const parsedURL = new URL(url);
    
    // Get query parameters as object
    const queryParams = {};
    for (const [key, value] of parsedURL.searchParams.entries()) {
      queryParams[key] = value;
    }
    
    return {
      protocol: parsedURL.protocol,
      hostname: parsedURL.hostname,
      pathname: parsedURL.pathname,
      search: parsedURL.search,
      hash: parsedURL.hash,
      queryParams: queryParams,
      origin: parsedURL.origin,
      host: parsedURL.host,
      port: parsedURL.port,
      username: parsedURL.username,
      password: parsedURL.password
    };
  } catch (err) {
    console.error('URL parsing error:', err);
    return null;
  }
}

/**
 * Get domain information
 */
export function getDomainInfo(url) {
  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname;
    
    // Get root domain (e.g., example.com from www.example.com)
    const hostParts = hostname.split('.');
    let rootDomain = hostname;
    
    if (hostParts.length > 2) {
      // Check for country TLDs like .co.uk
      const lastPart = hostParts[hostParts.length - 1];
      const secondLastPart = hostParts[hostParts.length - 2];
      
      if ((lastPart.length === 2 && secondLastPart.length <= 3) || 
          ['com', 'org', 'net', 'edu', 'gov', 'mil'].includes(secondLastPart)) {
        rootDomain = `${hostParts[hostParts.length - 3]}.${secondLastPart}.${lastPart}`;
      } else {
        rootDomain = `${hostParts[hostParts.length - 2]}.${lastPart}`;
      }
    }
    
    return {
      hostname: hostname,
      rootDomain: rootDomain,
      isSubdomain: hostParts.length > 2,
      tld: hostParts[hostParts.length - 1]
    };
  } catch (err) {
    console.error('Domain info error:', err);
    return null;
  }
}

/**
 * Check if URL is valid
 */
export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check URL status (active, broken, etc.)
 */
export async function checkURLStatus(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return {
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      redirectURL: response.redirected ? response.url : null
    };
  } catch (err) {
    return {
      status: 0,
      ok: false,
      error: err.message
    };
  }
}