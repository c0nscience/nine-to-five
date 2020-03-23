import {OVERTIME_LOADED} from './actions'

export const initialState = {
  overtimes: []
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case OVERTIME_LOADED:
      return {
        ...state,
        overtimes: action.payload
      }
    default:
      return state
  }
}
