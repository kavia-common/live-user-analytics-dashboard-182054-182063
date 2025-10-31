//
// Basic device utilities: parse user-agent and collect hints
//

// PUBLIC_INTERFACE
export function parseUserAgent(uaString) {
  /** Parse a user agent string and return { ua, os, browser, deviceType } */
  const ua = uaString || (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';

  let os = 'Unknown';
  let browser = 'Unknown';
  let deviceType = 'desktop';

  // OS detection
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iOS|iPhone|iPad|iPod/i.test(ua)) os = 'iOS';

  // Browser detection (simple)
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  // Device type
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    deviceType = /iPad/i.test(ua) ? 'tablet' : 'mobile';
  }

  return { ua, os, browser, deviceType };
}

// PUBLIC_INTERFACE
export function getLocationHints() {
  /** Provide optional location hints; left mostly empty for server enrichment */
  // Do not attempt network calls here; keep it synchronous and optional.
  // We provide IP as unavailable on client, server may enrich via headers.
  return {
    // ip intentionally omitted; backend should infer from request
    country: undefined,
    region: undefined,
    city: undefined,
  };
}
