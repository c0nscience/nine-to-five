import React, {createContext, useContext, useReducer} from 'react'
import {useAuth} from 'contexts/AuthenticationContext'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {createApi} from 'api'
import {initialState, reducer} from 'contexts/MetricsContext/reducer'
import {
  CREATE_NEW_METRIC_CONFIGURATION, DELETE_METRIC_CONFIGURATION,
  LOAD_METRIC_CONFIGURATIONS, LOAD_METRIC_DETAIL,
  metricConfigurationLoaded, metricDetailLoaded
} from 'contexts/MetricsContext/actions'

const MetricsContext = createContext()

export const MetricsProvider = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {getTokenSilently} = useAuth()
  const {addNetworkActivity, removeNetworkActivity} = useNetworkActivity()
  const {get, post, del, request} = createApi(getTokenSilently, addNetworkActivity, removeNetworkActivity)

  const loadMetricConfigurations = () => {
    request(get('metrics')
      .then(configurations => dispatch(metricConfigurationLoaded(configurations)))
    ).with(LOAD_METRIC_CONFIGURATIONS)
  }

  const saveNewMetricConfiguration = newConfiguration => {
    return request(post('metrics', newConfiguration))
      .with(CREATE_NEW_METRIC_CONFIGURATION)
  }

  const loadMetricDetail = id => {
    request(get(`metrics/${id}`)
      .then(metricDetail => dispatch(metricDetailLoaded(metricDetail)))
    ).with(LOAD_METRIC_DETAIL)
  }

  const deleteMetricConfiguration = id => {
    return request(del(`metrics/${id}`))
      .with(DELETE_METRIC_CONFIGURATION)
  }

  return <MetricsContext.Provider value={{
    ...state,
    loadMetricConfigurations,
    saveNewMetricConfiguration,
    loadMetricDetail,
    deleteMetricConfiguration
  }}
  >
    {children}
  </MetricsContext.Provider>
}

export const useMetrics = () => useContext(MetricsContext)
