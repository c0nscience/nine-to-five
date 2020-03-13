import React, {createContext, useContext, useEffect, useReducer} from 'react'
import {createApi} from 'api'
import {
  activitiesLoaded,
  activityStarted,
  activityStopped,
  LOAD_ACTIVITIES,
  LOAD_RUNNING_ACTIVITY,
  runningActivityLoaded,
  START_ACTIVITY,
  STOP_ACTIVITY
} from './actions'
import {initialState, reducer} from 'contexts/ActivityContext/reducer'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {useAuth} from 'contexts/AuthenticationContext'

const ActivityContext = createContext()

export const ActivityProvider = ({children}) => {
  const {getTokenSilently} = useAuth()
  const [state, dispatch] = useReducer(reducer, initialState)
  const {addNetworkActivity, removeNetworkActivity} = useNetworkActivity()
  const {get, post, createNetworkActivityDecorator} = createApi(getTokenSilently)
  const request = createNetworkActivityDecorator(addNetworkActivity, removeNetworkActivity)

  const loadActivities = () => {
    request(get('activities')
      .then(activitiesByWeek => dispatch(activitiesLoaded(activitiesByWeek)))
    ).with(LOAD_ACTIVITIES)
  }

  const loadRunning = () => {
    request(get('activity/running')
      .then(runningActivity => dispatch(runningActivityLoaded(runningActivity)))
    ).with(LOAD_RUNNING_ACTIVITY)
  }

  const startActivity = name => {
    request(post('activity', {name})
      .then(activity => dispatch(activityStarted(activity)))
    ).with(START_ACTIVITY)
  }

  const stopActivity = () => {
    request(post('activity/stop')
      .then(stoppedActivity => dispatch(activityStopped(stoppedActivity)))
    ).with(STOP_ACTIVITY)
  }

  useEffect(() => {
    loadActivities()
    loadRunning()
  }, [])

  return <ActivityContext.Provider value={{
    ...state,
    startActivity,
    stopActivity
  }}>
    {children}
  </ActivityContext.Provider>

}

export const useActivity = () => useContext(ActivityContext)
