import {METRIC_CONFIGURATIONS_LOADED} from 'contexts/MetricsContext/actions'

export const initialState = {
  configurations: []
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case METRIC_CONFIGURATIONS_LOADED:
      return {
        ...state,
        configurations: action.payload
      }
    default:
      return state

  }
}
