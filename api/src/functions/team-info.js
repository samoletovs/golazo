const { app } = require('@azure/functions');
const { getUser, jsonResponse } = require('../cosmos');

/**
 * POST /api/team-info — fetch basic info from a team's website.
 *
 * Body: { url: string }
 * Returns: { name, description, logoUrl, favicon }
 *
 * Extracts: <title>, meta description, og:image, favicon from the page.
 * Used to auto-fill team details when a user adds a website URL.
 */
app.http('team-info', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'team-info',
  handler: async (req) => {
    // Allow anonymous — team info fetching is read-only
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const { url } = body;
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      return jsonResponse({ error: 'Valid HTTPS URL is required' }, 400);
    }

    try {
      const html = await fetchPage(url);
      const info = extractInfo(html, url);
      return jsonResponse(info);
    } catch (err) {
      console.error('Team info fetch failed:', err.message);
      return jsonResponse({ error: `Failed to fetch page: ${err.message}` }, 502);
    }
  },
});

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Golazo/1.0)',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // Only read first 200KB to avoid large pages
    const text = await res.text();
    return text.slice(0, 200_000);
  } finally {
    clearTimeout(timeout);
  }
}

function extractInfo(html, baseUrl) {
  const result = {
    name: '',
    description: '',
    logoUrl: '',
    favicon: '',
  };

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  if (titleMatch) {
    result.name = titleMatch[1].trim()
      .replace(/\s*[|\-–—].*$/, '')  // strip " | Site Name" suffixes
      .trim();
  }

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']{1,500})["']/i)
    || html.match(/<meta[^>]*content=["']([^"']{1,500})["'][^>]*name=["']description["']/i);
  if (descMatch) {
    result.description = descMatch[1].trim();
  }

  // Extract og:image (often a team logo or banner)
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']{1,500})["']/i)
    || html.match(/<meta[^>]*content=["']([^"']{1,500})["'][^>]*property=["']og:image["']/i);
  if (ogImageMatch) {
    result.logoUrl = resolveUrl(ogImageMatch[1].trim(), baseUrl);
  }

  // Extract favicon
  const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']{1,300})["']/i)
    || html.match(/<link[^>]*href=["']([^"']{1,300})["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i);
  if (faviconMatch) {
    result.favicon = resolveUrl(faviconMatch[1].trim(), baseUrl);
  } else {
    // Default /favicon.ico
    try {
      const u = new URL(baseUrl);
      result.favicon = `${u.origin}/favicon.ico`;
    } catch { /* ignore */ }
  }

  // If no og:image, use apple-touch-icon as logo (often higher quality)
  if (!result.logoUrl) {
    const touchIconMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']{1,300})["']/i);
    if (touchIconMatch) {
      result.logoUrl = resolveUrl(touchIconMatch[1].trim(), baseUrl);
    }
  }

  return result;
}

function resolveUrl(href, baseUrl) {
  if (!href) return '';
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}
