import React, {createContext, useContext, useEffect, useReducer} from 'react'
import {initialState, reducer} from 'contexts/StatisticContext/reducer'
import {useAuth} from 'contexts/AuthenticationContext'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {createApi} from 'api'
import {
  configurationSaved, configurationsLoaded,
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
  const {get, put, request} = createApi(getTokenSilently, addNetworkActivity, removeNetworkActivity)

  const loadOvertime = () => {
    request(get('statistics/overtime')
      .then(overtime => dispatch(overtimeLoaded(overtime)))
    ).with(LOAD_OVERTIME)
  }

  useEffect(() => {
    loadOvertime()
  }, [])

  const loadConfigurations = () => {
    request(get('statistic/configurations')
      .then(configs => dispatch(configurationsLoaded(configs)))
    ).with(LOAD_CONFIGURATIONS)
  }

  const updateConfiguration = config => {
    request(put('statistic/configurations', config)
      .then(newConfig => dispatch(configurationSaved(newConfig)))
    ).with(SAVE_CONFIGURATION)
  }

  return <StatisticContext.Provider value={{
    ...state,
    loadConfigurations,
    updateConfiguration
  }}>
    {children}
  </StatisticContext.Provider>
}

export const useStatistics = () => useContext(StatisticContext)
