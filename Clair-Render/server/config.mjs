export function siteOrigin() {
  const value=process.env.SITE_ORIGIN || process.env.RENDER_EXTERNAL_URL;
  if(!value)throw Error('Domaine absent : utilise un Web Service Render ou définis SITE_ORIGIN.');
  return value.replace(/\/$/,'');
}
