const BASE_URL = process.env.REACT_APP_API_HOST

const url = (endpoint) => {
  return `${BASE_URL}/${endpoint}`
}

const authorizationHeader = async (getToken = () => '') => {
  const token = await getToken() //TODO integrate new auth0-spa-js library to handle authentication properly

  return {
    Authorization: `Bearer ${token}`
  }
}

const asJson = res => res.json()

export const get = (endpoint, getToken) => {
  return authorizationHeader(getToken)//TODO well that is odd ... not every request has 'Access-Control-Allow-Origin http://localhost:3000' set
    .then(token => fetch(url(endpoint), {
        method: 'GET',
        headers: {...token},
        mode: 'cors'
      }).then(asJson)
    )
}

export const head = (endpoint, getToken) => {
  return fetch(url(endpoint), {
    method: 'HEAD',
    headers: {...authorizationHeader(getToken)}
  })
}

export const post = (endpoint, body, getToken) => {
  return fetch(url(endpoint), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {...authorizationHeader(getToken), 'Content-Type': 'application/json'},
    mode: 'cors'
  }).then(asJson)
}

export const put = (endpoint, body, getToken) => {
  return fetch(url(endpoint), {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {...authorizationHeader(getToken), 'Content-Type': 'application/json'},
    mode: 'cors'
  }).then(asJson)
}

export const del = (endpoint, getToken) => {
  return fetch(url(endpoint), {
    method: 'DELETE',
    headers: {...authorizationHeader(getToken), 'Content-Type': 'application/json'},
    mode: 'cors'
  }).then(asJson)
}
