import React, {createContext, useContext, useReducer} from 'react'
import {useAuth0} from '@auth0/auth0-react'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {createApi} from 'api'
import {initialState, reducer} from 'contexts/MetricsContext/reducer'
import {
  CREATE_NEW_METRIC_CONFIGURATION, DELETE_METRIC_CONFIGURATION, LOAD_METRIC_CONFIGURATION,
  LOAD_METRIC_CONFIGURATIONS, LOAD_METRIC_DETAIL, metricConfigurationLoaded,
  metricConfigurationsLoaded, metricDetailLoaded, SAVE_METRIC_CONFIGURATION
} from 'contexts/MetricsContext/actions'

const MetricsContext = createContext()

export const MetricsProvider = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {getAccessTokenSilently} = useAuth0()
  const {addNetworkActivity, removeNetworkActivity} = useNetworkActivity()
  const {get, post, del, request} = createApi(getAccessTokenSilently, addNetworkActivity, removeNetworkActivity)

  const loadMetricConfigurations = () => {
    request(get('metrics')
      .then(configurations => dispatch(metricConfigurationsLoaded(configurations)))
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

  const loadMetricConfiguration = id => {
    return request(get(`metrics/${id}/config`)
      .then(metricConfiguration => dispatch(metricConfigurationLoaded(metricConfiguration)))
    ).with(LOAD_METRIC_CONFIGURATION)
  }

  const saveMetricConfiguration = config => {
    return request(post(`metrics/${config.id}`, config))
      .with(SAVE_METRIC_CONFIGURATION)
  }

  return <MetricsContext.Provider value={{
    ...state,
    loadMetricConfigurations,
    saveNewMetricConfiguration,
    loadMetricDetail,
    deleteMetricConfiguration,
    loadMetricConfiguration,
    saveMetricConfiguration
  }}
  >
    {children}
  </MetricsContext.Provider>
}

export const useMetrics = () => useContext(MetricsContext)
