const url = (endpoint) => {
  return `${import.meta.env.VITE_APP_HOST}/${endpoint}`
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

export function fetchActivities(token, from, to) {
  console.log('token', token)
  return fetch(url(`activities/${from}/${to}`), {
    method: 'GET',
    mode: 'cors',
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).then(asJson)
}
