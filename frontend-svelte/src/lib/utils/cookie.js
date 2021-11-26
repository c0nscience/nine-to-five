import {parse, serialize} from 'cookie'

export const getAll = (req) => {
  return parse(req.headers.cookie || '')
}

export const get = (req, name) => {
  const cookies = getAll(req)
  return cookies[name]
}

export const set = (res, name, value, options = {}) => {
  const strCookie = serialize(name, value, options)

  let previousCookies = res.headers['set-cookie'] || []
  if (!Array.isArray(previousCookies)) {
    previousCookies = [previousCookies]
  }

  res.headers['set-cookie'] = [...previousCookies, strCookie]
}

export const clear = (res, name, options = {}) => {
  set(res, name, '', {...options, maxAge: 0})
}
