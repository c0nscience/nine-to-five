import {JWK, JWKS, JWS} from 'jose'
import {signing} from '$lib/utils/hkdf'
import {clear as clearCookie, get as getCookie, set as setCookie} from '$lib/utils/cookie'
import {generators} from 'openid-client'
import {config} from '$lib/auth/config'


const header = {alg: 'HS256', b64: false, crit: ['b64']}
const getPayload = (cookie, value) => Buffer.from(`${cookie}=${value}`)
const generateSignature = (cookie, value, key) => {
  const payload = getPayload(cookie, value)
  return JWS.sign.flattened(payload, key, header).signature
}
const generateCookieValue = (cookie, value, key) => {
  const signature = generateSignature(cookie, value, key)
  return `${value}.${signature}`
}

const flattenedJWSFromCookie = (cookie, value, signature) => ({
  protected: Buffer.from(JSON.stringify(header))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_'),
  payload: getPayload(cookie, value),
  signature
})
const verifySignature = (cookie, value, signature, keystore) => {
  try {
    return !!JWS.verify(flattenedJWSFromCookie(cookie, value, signature), keystore, {
      algorithms: ['HS256'],
      crit: ['b64']
    })
  } catch (err) {
    return false
  }
}
const getCookieValue = (cookie, value, keystore) => {
  if (!value) {
    return undefined
  }
  let signature;
  [value, signature] = value.split('.')
  if (verifySignature(cookie, value, signature, keystore)) {
    return value
  }

  return undefined
}


export default function createStore() {
  const secret = config.secret
  const keystore = new JWKS.KeyStore()
  const currentKey = JWK.asKey(signing(secret))
  keystore.add(currentKey)

  const save = (key, req, res, {sameSite, value} = {sameSite: 'lax', value: generateNonce()}) => {
    const cookieValue = generateCookieValue(key, value, currentKey)
    const {domain, path} = config
    setCookie(res, key, cookieValue, {
      httpOnly: true,
      secure: domain.startsWith('https:'),
      domain,
      path,
      sameSite
    })
    return value
  }
  const read = (key, req, res) => {
    const cookie = getCookie(req, key)
    const {domain, path} = config

    let value = getCookieValue(key, cookie, keystore)
    clearCookie(res, key, {domain, path})

    return value
  }
  const generateNonce = () => {
    return generators.nonce()
  }
  const generateCodeVerifier = () => {
    return generators.codeVerifier()
  }
  const calculateCodeChallenge = (codeVerifier) => {
    return generators.codeChallenge(codeVerifier)
  }
  return {
    save,
    read,
    generateNonce,
    generateCodeVerifier,
    calculateCodeChallenge
  }
}
