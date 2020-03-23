import React, {createContext, useContext, useEffect, useReducer} from 'react'
import {createApi} from 'api'
import {
  activitiesLoaded,
  activityStarted,
  activityStopped,
  deselectActivity as deselectActivityAction,
  LOAD_ACTIVITIES,
  LOAD_RUNNING_ACTIVITY,
  runningActivityLoaded,
  selectActivity as selectActivityAction,
  START_ACTIVITY,
  STOP_ACTIVITY
} from './actions'
import {initialState, reducer} from 'contexts/ActivityContext/reducer'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {useAuth} from 'contexts/AuthenticationContext'

const ActivityContext = createContext()

export const ActivityProvider = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {getTokenSilently} = useAuth()
  const {addNetworkActivity, removeNetworkActivity} = useNetworkActivity()
  const {get, post, request} = createApi(getTokenSilently, addNetworkActivity, removeNetworkActivity)

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

  useEffect(() => {
    loadActivities()
    loadRunning()
  }, [])

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

  const selectActivity = activity => {
    dispatch(selectActivityAction(activity))
  }

  const deselectActivity = () => {
    dispatch(deselectActivityAction())
  }

  return <ActivityContext.Provider value={{
    ...state,
    startActivity,
    stopActivity,
    selectActivity,
    deselectActivity
  }}>
    {children}
  </ActivityContext.Provider>

}

export const useActivity = () => useContext(ActivityContext)
