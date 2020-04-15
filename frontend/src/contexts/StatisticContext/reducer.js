import {CONFIGURATION_CREATED, CONFIGURATION_UPDATED, CONFIGURATIONS_LOADED, OVERTIME_LOADED} from './actions'

export const initialState = {
  overtimes: [],
  configurations: []
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case OVERTIME_LOADED:
      return {
        ...state,
        overtimes: action.payload
      }
    case CONFIGURATION_CREATED:
      return {
        ...state,
        configurations: [
          action.payload,
          ...state.configurations
        ]
      }
    case CONFIGURATIONS_LOADED:
      return {
        ...state,
        configurations: action.payload
      }

    case CONFIGURATION_UPDATED:
      return {
        ...state,
        configurations: state.configurations.map(c => {
          if (c.id === action.payload.id) {
            return action.payload
          } else {
            return c
          }
        })
      }
    default:
      return state
  }
}
