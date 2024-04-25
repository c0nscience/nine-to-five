import React, {createContext, useContext, useReducer} from 'react'
import {initialState, reducer} from 'contexts/NetworkContext/reducer'
import {addNetworkActivity, removeNetworkActivity} from './actions'


const NetworkContext = createContext()

export const NetworkActivityProvider = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const addActivity = activity => dispatch(addNetworkActivity(activity))
  const removeActivity = activity => dispatch(removeNetworkActivity(activity))

  const isLoading = (actionType) => state.runningRequests.indexOf(actionType) > -1

  return <NetworkContext.Provider value={{
    runningRequests: state.runningRequests,
    addNetworkActivity: addActivity,
    removeNetworkActivity: removeActivity,
    isLoading
  }}>
    {children}
  </NetworkContext.Provider>
}

export const useNetworkActivity = () => useContext(NetworkContext)
