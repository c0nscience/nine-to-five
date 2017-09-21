const BASE_URL = 'http://localhost:9000/'

const callApi = (endpoint, authenticated) => {

  let token = localStorage.getItem('access_token') || null
  let config = {}

  if (authenticated) {
    if (token) {
      config = {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    } else {
      throw new Error('No token saved!')
    }
  }

  return fetch(BASE_URL + endpoint, config)
    .then(response => response.ok ? response : Promise.reject(response.statusText))
    .then(response => response.json())
}

export const CALL_API = Symbol('Call API')

export default store => next => action => {

  const callAPI = action[CALL_API]

  // So the middleware doesn't get applied to every single action
  if (typeof callAPI === 'undefined') {
    return next(action)
  }

  let { endpoint, types, authenticated } = callAPI

  // eslint-disable-next-line
  const [requestType, successType, errorType] = types

  // Passing the authenticated boolean back in our data will let us distinguish between normal and secret quotes
  return callApi(endpoint, authenticated).then(
    response => next({
        response,
        authenticated,
        type: successType
      }),
    error => next({
      error: error.message || 'There was an error.',
      type: errorType
    })
  )
}
