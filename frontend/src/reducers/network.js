import { ADD_NETWORK_ACTIVITY, REMOVE_NETWORK_ACTIVITY } from '../actions'

const initialState = {
  runningRequests: []
}

export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_NETWORK_ACTIVITY:
      return {
        ...state,
        runningRequests: [
          ...state.runningRequests,
          action.payload
        ]
      }
    case REMOVE_NETWORK_ACTIVITY:
      const index = state.runningRequests.indexOf(action.payload)
      return {
        ...state,
        runningRequests: [
          ...state.runningRequests.slice(0, index),
          ...state.runningRequests.slice(index + 1)
        ]
      }
    default:
      return state
  }
}
