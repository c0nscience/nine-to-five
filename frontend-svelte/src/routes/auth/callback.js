import getClient from '$lib/auth/client'
import createStore from '$lib/auth/store'
import {config} from '$lib/auth/config'

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get(req) {
  const client = await getClient()
  const store = createStore()
  const res = {
    headers: {}
  }
  const redirectUri = `${config.baseUrl}/auth/callback`
  const expectedState = store.read('state', req, res)
  const code_verifier = store.read('code_verifier', req, res)
  const nonce = store.read('nonce', req, res)

  const tokenSet = await client.callback(
    redirectUri,
    req.query,
    {
      code_verifier,
      nonce,
      state: expectedState
    }
  )

  res.headers.location = config.baseUrl
  res.status = 302
  return res
}
