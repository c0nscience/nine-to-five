import React, {createContext, useContext, useReducer} from 'react'
import {useAuth} from 'contexts/AuthenticationContext'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {createApi} from 'api'
import {initialState, reducer} from 'contexts/MetricsContext/reducer'
import {
  CREATE_NEW_METRIC_CONFIGURATION,
  LOAD_METRIC_CONFIGURATIONS,
  metricConfigurationLoaded
} from 'contexts/MetricsContext/actions'

const MetricsContext = createContext()

export const MetricsProvider = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {getTokenSilently} = useAuth()
  const {addNetworkActivity, removeNetworkActivity} = useNetworkActivity()
  const {get, post, request} = createApi(getTokenSilently, addNetworkActivity, removeNetworkActivity)

  const loadMetricConfigurations = () => {
    request(get('metrics')
      .then(configurations => dispatch(metricConfigurationLoaded(configurations)))
    ).with(LOAD_METRIC_CONFIGURATIONS)
  }

  const saveNewMetricConfiguration = newConfiguration => {
    return request(post('metrics', newConfiguration))
      .with(CREATE_NEW_METRIC_CONFIGURATION)
  }

  return <MetricsContext.Provider value={{
    ...state,
    loadMetricConfigurations,
    saveNewMetricConfiguration
  }}
  >
    {children}
  </MetricsContext.Provider>
}

export const useMetrics = () => useContext(MetricsContext)
