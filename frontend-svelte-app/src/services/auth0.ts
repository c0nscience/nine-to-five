import type {
  Auth0Client,
  GetTokenSilentlyOptions,
  LogoutOptions,
  RedirectLoginOptions,
  User
} from '@auth0/auth0-spa-js'
import { createAuth0Client } from '@auth0/auth0-spa-js'
import type { Writable } from 'svelte/store'
import { get, writable } from 'svelte/store'

const _useAuth0 = () => {
  const auth0Client: Writable<Auth0Client> = writable(null)
  const isAuthenticated: Writable<boolean> = writable(false)
  const isLoading: Writable<boolean> = writable(true)
  const user: Writable<User> = writable(null)
  const error = writable(null)

  const initializeAuth0 = async (config: { onRedirectCallback?: any } = {}) => {
    auth0Client.set(
      await createAuth0Client({
        domain: import.meta.env.VITE_AUTH0_DOMAIN,
        clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
        authorizationParams: {
          redirect_uri: import.meta.env.VITE_AUTH0_CALLBACK_URL,
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        },
      })
    )

    if (!config.onRedirectCallback) {
      config.onRedirectCallback = () => {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        )
      }
    }

    try {
      const search = window.location.search

      if ((search.includes('code=') || search.includes('error=')) && search.includes('state=')) {
        const { appState } = await get(auth0Client).handleRedirectCallback()
        console.log('appState', appState)
        config.onRedirectCallback(appState)
      }
    } catch (e) {
      console.log('error', e)
      error.set(e)
    } finally {
      console.log('are we done yet?')
      isAuthenticated.set(await get(auth0Client).isAuthenticated())
      user.set(await get(auth0Client).getUser() || null)
      isLoading.set(false)
    }
  }

  const login = async (options: RedirectLoginOptions) => {
    await get(auth0Client).loginWithRedirect(options)
  }

  const logout = async (options: LogoutOptions) => {
    get(auth0Client).logout(options)
  }

  const getAccessToken = async (options: GetTokenSilentlyOptions) => {
    return await get(auth0Client).getTokenSilently(options)
  }


  return {
    isAuthenticated,
    isLoading,
    user,
    error,

    initializeAuth0,
    login,
    logout,
    getAccessToken,
  }
}

export const useAuth0 = _useAuth0()
