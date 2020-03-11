import React, {createContext, useContext, useReducer} from 'react'
import {get, post} from 'api'
import {activitiesLoaded} from './actions'
import {initialState, reducer} from 'contexts/ActivityContext/reducer'

const ActivityContext = createContext()

export const ActivityProvider = ({addNetworkActivity, removeNetworkActivity, children}) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadActivities = () => {
    get('activities').then(activitiesByWeek => dispatch(activitiesLoaded(activitiesByWeek)))
  }

  const startActivity = name => {
    //TODO maintain running network activities state
    post('activity', {name})
  }

  return <ActivityContext.Provider value={}>
    {children}
  </ActivityContext.Provider>

}

export const useActivity = () => useContext(ActivityContext)
