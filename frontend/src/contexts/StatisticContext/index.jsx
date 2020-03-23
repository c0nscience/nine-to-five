import React, {createContext, useContext, useEffect, useReducer} from 'react'
import {initialState, reducer} from 'contexts/StatisticContext/reducer'
import {useAuth} from 'contexts/AuthenticationContext'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {createApi} from 'api'
import {LOAD_OVERTIME, overtimeLoaded} from 'contexts/StatisticContext/actions'

const StatisticContext = createContext()

export const StatisticProvider = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {getTokenSilently} = useAuth()
  const {addNetworkActivity, removeNetworkActivity} = useNetworkActivity()
  const {get, request} = createApi(getTokenSilently, addNetworkActivity, removeNetworkActivity)

  const loadOvertime = () => {
    request(get('statistics/overtime')
      .then(overtime => dispatch(overtimeLoaded(overtime)))
    ).with(LOAD_OVERTIME)
  }

  useEffect(() => {
    loadOvertime()
  }, [])

  return <StatisticContext.Provider value={{
    ...state
  }}>
    {children}
  </StatisticContext.Provider>
}

export const useStatistics = () => useContext(StatisticContext)
