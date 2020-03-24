import axios from 'axios'

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
  return res.data
}

export const createApi = (getToken, addNetworkActivity, removeNetworkActivity) => {
  return {
    request: promise => {
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
      //TODO find a bloody solution for reliable http requests
      //TODO handle 401 responses properly and retry request transparently
      return axios.get(url(endpoint))
        .catch(e => console.log('error2', e))
        .then(asJson)
      // return authorizationHeader(getToken)
      //   .then(token => axios.get(url(endpoint), {
      //     headers: {...token}
      //   }).catch(e => console.log('error2', e.response)))
      //   .catch(e => console.log('error', e.response))
      //   .then(asJson)
    },

    head: (endpoint) => {
      return authorizationHeader(getToken)
        .then(token => fetch(url(endpoint), {
          method: 'HEAD',
          headers: {
            ...token
          }
        }))
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
        }))
        .then(asJson)
    },

    put: (endpoint, body) => {
      return authorizationHeader(getToken)
        .then(token => fetch(url(endpoint), {
          method: 'PUT',
          body: JSON.stringify(body),
          headers: {
            ...token,
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        }))
        .then(asJson)
    },

    del: (endpoint) => {
      return authorizationHeader(getToken)
        .then(token => fetch(url(endpoint), {
          method: 'DELETE',
          headers: {
            ...token,
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        }))
        .then(asJson)
    }
  }
}

