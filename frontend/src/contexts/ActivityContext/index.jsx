import React, {createContext, useContext, useEffect, useReducer} from 'react'
import {createApi} from 'api'
import {
  activitiesInRangeLoaded,
  activitiesLoaded,
  activityDeleted,
  activitySaved,
  activityStarted,
  activityStopped,
  DELETE_ACTIVITY,
  deselectActivity as deselectActivityAction,
  LOAD_ACTIVITIES,
  LOAD_ACTIVITIES_IN_RANGE,
  LOAD_RUNNING_ACTIVITY,
  runningActivityLoaded,
  SAVE_ACTIVITY,
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
  const {get, post, put, del, request} = createApi(getTokenSilently, addNetworkActivity, removeNetworkActivity)

  const loadActivities = () => {
    request(get('activities')
      .then(activitiesByWeek => dispatch(activitiesLoaded(activitiesByWeek)))
    ).with(LOAD_ACTIVITIES)
  }

  const loadActivitiesInRange = (from, to, signal) => {
    request(get(`activities/${from.toISODate()}/${to.toISODate()}`, signal)
      .then(activities => {
        if (activities.entries.length > 0) {
          dispatch(activitiesInRangeLoaded(activities))
        }
      })
    ).with(LOAD_ACTIVITIES_IN_RANGE)
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
    return request(post('activity', {name})
      .then(activity => dispatch(activityStarted(activity)))
    ).with(START_ACTIVITY)
  }

  const stopActivity = () => {
    return request(post('activity/stop')
      .then(stoppedActivity => dispatch(activityStopped(stoppedActivity)))
    ).with(STOP_ACTIVITY)
  }

  const selectActivity = activity => {
    dispatch(selectActivityAction(activity))
  }

  const deselectActivity = () => {
    dispatch(deselectActivityAction())
  }

  const saveActivity = (changedActivity, oldActivity) => {
    dispatch(deselectActivityAction())
    request(put(`activity/${changedActivity.id}`, changedActivity)
      .then(savedActivity => {
        dispatch(activityDeleted(oldActivity))
        dispatch(activitySaved(savedActivity))
      }))
      .with(SAVE_ACTIVITY)
  }

  const deleteActivity = id => {
    dispatch(deselectActivityAction())
    request(del(`activity/${id}`)
      .then(deletedActivity => dispatch(activityDeleted(deletedActivity))))
      .with(DELETE_ACTIVITY)
  }

  const switchActivity = name => {
    stopActivity()
      .then(() => startActivity(name))
  }

  const continueActivity = name => {
    startActivity(name)
  }

  return <ActivityContext.Provider value={{
    ...state,
    startActivity,
    stopActivity,
    selectActivity,
    deselectActivity,
    saveActivity,
    deleteActivity,
    switchActivity,
    continueActivity,
    loadActivitiesInRange
  }}>
    {children}
  </ActivityContext.Provider>

}

export const useActivity = () => useContext(ActivityContext)
