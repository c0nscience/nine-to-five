const BASE_URL = process.env.REACT_APP_API_HOST

const url = (endpoint) => {
  return `${BASE_URL}/${endpoint}`
}

const authorizationHeader = () => {
  const token = localStorage.getItem('access_token')

  return {
    Authorization: `Bearer ${token}`
  }
}

const asJson = res => res.json()

export const get = (endpoint) => {
  return fetch(url(endpoint), {
    method: 'GET',
    headers: {...authorizationHeader()}
  }).then(asJson)
}

export const head = (endpoint) => {
  return fetch(url(endpoint), {
    method: 'HEAD',
    headers: {...authorizationHeader()}
  })
}

export const post = (endpoint, body) => {
  return fetch(url(endpoint), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {...authorizationHeader(), 'Content-Type': 'application/json'},
    mode: 'cors'
  }).then(asJson)
}

export const put = (endpoint, body) => {
  return fetch(url(endpoint), {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {...authorizationHeader(), 'Content-Type': 'application/json'},
    mode: 'cors'
  }).then(asJson)
}

export const del = (endpoint) => {
  return fetch(url(endpoint), {
    method: 'DELETE',
    headers: {...authorizationHeader(), 'Content-Type': 'application/json'},
    mode: 'cors'
  }).then(asJson)
}
