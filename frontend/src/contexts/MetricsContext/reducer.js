import {
  METRIC_CONFIGURATION_LOADED,
  METRIC_CONFIGURATIONS_LOADED,
  METRIC_DETAIL_LOADED
} from 'contexts/MetricsContext/actions'

export const initialState = {
  configurations: [],
  configuration: undefined,
  metricDetail: undefined
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case METRIC_CONFIGURATIONS_LOADED:
      return {
        ...state,
        configurations: action.payload
      }
    case METRIC_DETAIL_LOADED:
      return {
        ...state,
        metricDetail: action.payload
      }
    case METRIC_CONFIGURATION_LOADED:
      return {
        ...state,
        configuration: action.payload
      }
    default:
      return state
  }
}
