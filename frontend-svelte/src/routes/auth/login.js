import getClient from '$lib/auth/client'
import base64url from 'base64url'
import createStore from '$lib/auth/store'
import {config} from '$lib/auth/config'

const encodeState = (stateObject) => {
  const {nonce, code_verifier, max_age, ...filteredState} = stateObject
  return base64url.encode(JSON.stringify(filteredState))
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get(req) {
  const client = await getClient()
  const store = createStore()

  const stateValue = {
    nonce: store.generateNonce(),
    code_verifier: store.generateCodeVerifier()
  }
  const res = {
    headers: {}
  }

  const authorizationUrl = client.authorizationUrl({
    response_type: 'code',
    response_mode: 'query',
    audience: 'https://api.ntf.io',
    scope: 'openid read:activities start:activity stop:activity update:activity delete:activity read:metrics create:metrics delete:metrics update:metric',

    nonce: store.save('nonce', req, res),
    state: store.save('nonce', req, res, {sameSite: 'lax', value: encodeState(stateValue)}),
    code_challenge: store.calculateCodeChallenge(
      store.save('code_verifier', req, res)
    ),
    redirect_uri: `${config.baseUrl}/auth/callback`,
    code_challenge_method: 'S256'
  })
  console.log('redirect to ', authorizationUrl)
  res.headers.location = authorizationUrl
  res.status = 302
  return res
}
