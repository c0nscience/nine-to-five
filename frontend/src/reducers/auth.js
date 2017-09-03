import auth0 from 'auth0-js'
import { push } from 'connected-react-router'
import { AUTH_CONFIG } from './auth0-config'

const LOGIN_REQUEST = 'LOGIN_REQUEST'
const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
const LOGIN_FAILURE = 'LOGIN_FAILURE'

const requestLogin = () =>
  ({ type: LOGIN_REQUEST })

const receiveLogin = (authResult) =>
  ({ type: LOGIN_SUCCESS, payload: authResult })

const loginError = (message) =>
  ({ type: LOGIN_FAILURE, payload: message })

const auth = new auth0.WebAuth({
  domain: AUTH_CONFIG.domain,
  clientID: AUTH_CONFIG.clientId,
  redirectUri: AUTH_CONFIG.callbackUrl,
  audience: `https://${AUTH_CONFIG.domain}/userinfo`,
  responseType: 'token',
  scope: 'openid'
})

export const login = () => (dispatch) => {
  dispatch(requestLogin())
  auth.authorize()
}

export const handleAuthentication = () => (dispatch) => (
  auth.parseHash((err, authResult) => {
    if (authResult && authResult.accessToken) {
      setSession(authResult)
      dispatch(receiveLogin(authResult))
      dispatch(push('/'))
      return Promise.resolve()
    } else if (err) {
      dispatch(loginError(err.error))
      dispatch(push('/'))
      return Promise.reject()
    }
  })
)

const setSession = (authResult) => {
  // Set the time that the access token will expire at
  let expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime())
  localStorage.setItem('access_token', authResult.accessToken)
  localStorage.setItem('expires_at', expiresAt)
}

export const LOGOUT_REQUEST = 'LOGOUT_REQUEST'
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS'

const requestLogout = () =>
  ({ type: LOGOUT_REQUEST })

const receiveLogout = () =>
  ({ type: LOGOUT_SUCCESS })

export const logout = () => (dispatch) => {
  dispatch(requestLogout())

  localStorage.removeItem('access_token')
  localStorage.removeItem('expires_at')

  dispatch(receiveLogout())
  dispatch(push('/'))
}

export default (state = {
  isFetching: false,
  isAuthenticated: !!localStorage.getItem('access_token'),
  accessToken: localStorage.getItem('access_token') || ''
}, action) => {
  switch (action.type) {
    case LOGIN_REQUEST:
      return {
        ...state,
        isFetching: true,
        isAuthenticated: false,
        accessToken: ''
      }
    case LOGIN_SUCCESS:
      return {
        ...state,
        isFetching: false,
        isAuthenticated: true,
        accessToken: action.payload.accessToken
      }
    case LOGIN_FAILURE:
      return {
        ...state,
        isFetching: false,
        isAuthenticated: false,
        accessToken: '',
        errorMessage: action.payload
      }
    case LOGOUT_REQUEST:
      return {
        ...state,
        isFetching: true,
        isAuthenticated: true
      }
    case LOGOUT_SUCCESS:
      return {
        ...state,
        isFetching: false,
        isAuthenticated: false,
        accessToken: ''
      }
    default:
      return state
  }
}
