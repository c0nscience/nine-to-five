import React, {createContext, useContext, useEffect, useReducer} from 'react'
import {initialState, reducer} from 'contexts/StatisticContext/reducer'
import {useAuth} from 'contexts/AuthenticationContext'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {createApi} from 'api'
import {
  configurationCreated,
  configurationSaved, configurationsLoaded, CREATE_CONFIGURATION,
  LOAD_CONFIGURATIONS,
  LOAD_OVERTIME,
  overtimeLoaded,
  SAVE_CONFIGURATION
} from 'contexts/StatisticContext/actions'

const StatisticContext = createContext()

export const StatisticProvider = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {getTokenSilently} = useAuth()
  const {addNetworkActivity, removeNetworkActivity} = useNetworkActivity()
  const {get, put, post, request} = createApi(getTokenSilently, addNetworkActivity, removeNetworkActivity)

  const loadOvertime = () => {
    request(get('statistics/overtime')
      .then(overtime => dispatch(overtimeLoaded(overtime)))
    ).with(LOAD_OVERTIME)
  }

  const loadConfigurations = () => {
    request(get('statistic/configurations')
      .then(configs => dispatch(configurationsLoaded(configs)))
    ).with(LOAD_CONFIGURATIONS)
  }

  useEffect(() => {
    loadOvertime()
    loadConfigurations()
  }, [])

  const createConfiguration = config => {
    request(post('statistic/configurations', config)
      .then(newConfig => dispatch(configurationCreated(newConfig)))
    ).with(CREATE_CONFIGURATION)
  }

  const updateConfiguration = config => {
    request(put('statistic/configurations', config)
      .then(newConfig => dispatch(configurationSaved(newConfig)))
    ).with(SAVE_CONFIGURATION)
  }

  return <StatisticContext.Provider value={{
    ...state,
    loadConfigurations,
    updateConfiguration,
    createConfiguration
  }}>
    {children}
  </StatisticContext.Provider>
}

export const useStatistics = () => useContext(StatisticContext)
