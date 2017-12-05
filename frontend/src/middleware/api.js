const BASE_URL = process.env.REACT_APP_API_HOST

const callApi = (endpoint, config = {}, data, authenticated) => {

  const token = localStorage.getItem('access_token') || null

  if (authenticated) {
    if (token) {
      config = {
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        }
      }
    } else {
      return Promise.reject(UNAUTHENTICATED)
    }
  }

  if (config.method && (config.method.toLocaleLowerCase() === 'post' || config.method.toLocaleLowerCase() === 'put') && typeof data !== 'undefined') {
    config = {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  }

  return fetch(`${BASE_URL}/${endpoint}`, config)
    .then(response => {
      if (response.ok) {
        return response.json()
      } else if (response.status === 401) {
        return Promise.reject(UNAUTHORIZED)
      } else if (response.status === 403) {
        return Promise.reject(UNAUTHORIZED)
      } else {
        return Promise.reject(response)
      }
    })
}

const UNAUTHORIZED = Symbol('UNAUTHORIZED')
const UNAUTHENTICATED = Symbol('UNAUTHENTICATED')
export const API_REQUEST_ENDED = 'API_REQUEST_ENDED'
export const CALL_API = Symbol('Call API')

export default store => next => action => {

  const callAPI = action[CALL_API]

  // So the middleware doesn't get applied to every single action
  if (typeof callAPI === 'undefined') {
    return next(action)
  }

  let { endpoint, types, authenticated, additionalSuccessTypes = [], config, data } = callAPI

  // eslint-disable-next-line
  const [requestType, successType, errorType, endedType = API_REQUEST_ENDED] = types

  next({type: requestType})
  // Passing the authenticated boolean back in our data will let us distinguish between normal and secret quotes
  return callApi(endpoint, config, data, authenticated)
    .then(response => {
      additionalSuccessTypes.forEach(type => next({
        response,
        authenticated,
        type
      }))
      return response
    })
    .then(
      response => {
        next({
          response,
          authenticated,
          type: successType
        })
        next({type: endedType})
      },
      error => {
        next({type: endedType})
        if (error === UNAUTHORIZED) {
          next({
            type: 'LOGOUT_SUCCESS'
          })
        } else if (error === UNAUTHENTICATED) {
          next({
            type: 'LOGOUT_SUCCESS'
          })
        } else {
          next({
            error: error.message || 'There was an error.',
            type: errorType
          })
        }
      }
    )
}
