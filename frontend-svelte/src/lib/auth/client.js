import {Issuer} from 'openid-client'
import {config} from '$lib/auth/config'

let client = undefined

export default async function get() {
  if (client) {
    return client
  }

  const issuer = await Issuer.discover(config.issuerBaseUrl)

  client = new issuer.Client({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    id_token_encrypted_response_alg: config.alg
  })

  return client
}
