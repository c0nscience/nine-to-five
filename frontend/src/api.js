const BASE_URL = process.env.REACT_APP_API_HOST
const BASE_URL_GPI = process.env.REACT_APP_GPI_HOST

const url = (endpoint, url) => {
  if (!url) {
    url = BASE_URL
  }
  return `${url}/${endpoint}`
}

const resolveUrl = (endpoint, gpi) => {
  if (gpi) {
    return url(endpoint, BASE_URL_GPI)
  }
  return url(endpoint)
}

const authorizationHeader = async (getToken) => {
  const token = await getToken()
  return {
    Authorization: `Bearer ${token}`
  }
}

const extractJsonOrResolve = res => {
  if (res.status === 204) {
    return Promise.resolve()
  } else {
    return res.json()
  }
}

const asJson = res => {
  if (res.ok) {
    return extractJsonOrResolve(res)
  } else {
    return Promise.reject({
      status: res.status
    })
  }
}

export const createApi = (getToken, addNetworkActivity, removeNetworkActivity) => {
  const request = promise => {
    return {
      with: networkActivity => {
        addNetworkActivity(networkActivity)
        return promise
          .then(d => {
            removeNetworkActivity(networkActivity)
            return d
          })
          .catch(e => {
            removeNetworkActivity(networkActivity)
          })
      }
    }
  }

  const get = (endpoint, signal) => {
    return authorizationHeader(getToken)
      .then(token => fetch(url(endpoint), {
        method: 'GET',
        headers: {...token},
        mode: 'cors',
        signal
      })).then(asJson)
  }

  const head = (endpoint) => {
    return authorizationHeader(getToken)
      .then(token => fetch(url(endpoint), {
        method: 'HEAD',
        headers: {
          ...token
        }
      }))
  }

  const post = (endpoint, body, gpi) => {
    const u = resolveUrl(endpoint, gpi)
    return authorizationHeader(getToken)
      .then(token => fetch(u, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          ...token,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      }))
      .then(asJson)
  }

  const put = (endpoint, body) => {
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
  }

  const del = (endpoint, body) => {
    return authorizationHeader(getToken)
      .then(token => fetch(url(endpoint), {
        method: 'DELETE',
        body: (body && JSON.stringify(body)) || {},
        headers: {
          ...token,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      }))
      .then(asJson)
  }


  return {request, get, del, put, post, head}
}

