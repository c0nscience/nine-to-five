import React, {createContext, useContext, useEffect, useReducer} from 'react'
import {get, post} from 'api'
import {activitiesLoaded, activityStarted} from './actions'
import {initialState, reducer} from 'contexts/ActivityContext/reducer'

const ActivityContext = createContext()

export const ActivityProvider = ({addNetworkActivity, removeNetworkActivity, getToken, children}) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadActivities = () => {
    get('activities', getToken).then(activitiesByWeek => dispatch(activitiesLoaded(activitiesByWeek)))
  }

  const startActivity = name => {
    //TODO maintain running network activities state
    post('activity', {name}, getToken).then(activity => dispatch(activityStarted(activity)))
  }

  useEffect(() => {
    loadActivities()
  }, [])

  return <ActivityContext.Provider value={{...state}}>
    {children}
  </ActivityContext.Provider>

}

export const useActivity = () => useContext(ActivityContext)
