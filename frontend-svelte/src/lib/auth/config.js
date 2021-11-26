export const config = {
  clientId: import.meta.env.VITE_CLIENT_ID,
  clientSecret: import.meta.env.VITE_CLIENT_SECRET,
  secret: import.meta.env.VITE_SECRET,
  domain: import.meta.env.VITE_DOMAIN,
  issuerBaseUrl: import.meta.env.VITE_ISSUER_BASE_URL,
  baseUrl: import.meta.env.VITE_BASE_URL,
  path: '/',
  alg: 'RS256'
}
