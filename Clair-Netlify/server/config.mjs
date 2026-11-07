// Public deployment address. Secrets belong in Netlify environment variables.
export function siteOrigin() {
  return process.env.SITE_ORIGIN || 'https://clairsearch45.netlify.app';
}
