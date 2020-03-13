const BASE_URL = process.env.REACT_APP_API_HOST

const url = (endpoint) => {
  return `${BASE_URL}/${endpoint}`
}

const authorizationHeader = async (getToken) => {
  const token = await getToken()
  return {
    Authorization: `Bearer ${token}`
  }
}

const asJson = res => {
  if (res.ok) {
    return res.json()
  } else {
    return Promise.reject()
  }
}

export const createApi = getToken => ({
    createNetworkActivityDecorator: (addNetworkActivity, removeNetworkActivity) => promise => {
      return {
        with: networkActivity => {
          addNetworkActivity(networkActivity)
          return promise
            .then(() => removeNetworkActivity(networkActivity))
            .catch(() => removeNetworkActivity(networkActivity))
        }
      }
    },

    get: (endpoint) => {
      return authorizationHeader(getToken)
        .then(token => fetch(url(endpoint), {
            method: 'GET',
            headers: {...token},
            mode: 'cors'
          })
        )
        .then(asJson)
    },

    head: (endpoint) => {
      return fetch(url(endpoint), {
        method: 'HEAD',
        headers: {
          ...authorizationHeader(getToken)
        }
      })
    },

    post: (endpoint, body) => {
      return authorizationHeader(getToken)
        .then(token => fetch(url(endpoint), {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
              ...token,
              'Content-Type': 'application/json'
            },
            mode: 'cors'
          })
        )
        .then(asJson)
    },

    put: (endpoint, body) => {
      return fetch(url(endpoint), {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          ...authorizationHeader(getToken),
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      }).then(asJson)
    },

    del: (endpoint) => {
      return fetch(url(endpoint), {
        method: 'DELETE',
        headers: {
          ...authorizationHeader(getToken),
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      }).then(asJson)
    }
  }
)

