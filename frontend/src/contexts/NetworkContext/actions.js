export const ADD_NETWORK_ACTIVITY = 'ADD_NETWORK_ACTIVITY'
export const REMOVE_NETWORK_ACTIVITY = 'REMOVE_NETWORK_ACTIVITY'

export const addNetworkActivity = networkActivity =>
  ({type: ADD_NETWORK_ACTIVITY, payload: networkActivity})

export const removeNetworkActivity = networkActivity =>
  ({type: REMOVE_NETWORK_ACTIVITY, payload: networkActivity})
