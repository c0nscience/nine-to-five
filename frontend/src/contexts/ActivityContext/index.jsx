import React, {createContext, useContext, useReducer} from 'react'
import {createApi} from 'api'
import {
  activitiesInRangeLoaded,
  activityCleared,
  activityStarted,
  activityStopped,
  LOAD_ACTIVITIES_IN_RANGE,
  LOAD_USED_TAGS,
  REPEAT_ACTIVITY,
  START_ACTIVITY,
  STOP_ACTIVITY,
  usedTagsLoaded
} from './actions'
import {initialState, reducer} from 'contexts/ActivityContext/reducer'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {useAuth0} from '@auth0/auth0-react'
import {
  activityDeleted,
  activityLoaded,
  DELETE_ACTIVITY,
  LOAD_ACTIVITY,
  LOAD_RUNNING_ACTIVITY,
  runningActivityLoaded,
  SAVE_ACTIVITY
} from 'contexts/ActivityContext/actions'

const ActivityContext = createContext()

export const ActivityProvider = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {getAccessTokenSilently} = useAuth0()
  const {addNetworkActivity, removeNetworkActivity, isLoading} = useNetworkActivity()
  const {get, post, put, del, request} = createApi(getAccessTokenSilently, addNetworkActivity, removeNetworkActivity)

  const loadRunning = () => {
    request(get('activity/running', undefined, true)
      .then(runningActivity => dispatch(runningActivityLoaded(runningActivity)))
      .catch(e => {
        if (e.status === 404) {
          dispatch(runningActivityLoaded(undefined))
        } else {
          return e
        }
      })
    ).with(LOAD_RUNNING_ACTIVITY)
  }

  //TODO this should move into an own TagsContext, which then also can take care of providing methods to maintain tags like changing color and such
  const loadUsedTags = () => {
    request(get('activities/tags', undefined, true)
      .then(tags => dispatch(usedTagsLoaded(tags))))
      .with(LOAD_USED_TAGS)
  }

  const loadActivitiesInRange = (from, to, signal) => {
    return request(get(`activities/${from.toISODate()}/${to.toISODate()}`, signal, true)
      .then(activities => dispatch(activitiesInRangeLoaded(activities)))
    ).with(LOAD_ACTIVITIES_IN_RANGE)
  }

  const isLoadingActivitiesInRange = () => isLoading(LOAD_ACTIVITIES_IN_RANGE)

  const startActivity = activity => {
    return request(post('activity', activity, true)
      .then(activity => {
        dispatch(activityStarted(activity))
        return activity
      })
    ).with(START_ACTIVITY)
  }

  const repeatActivity = ac => {
    return request(post('activity/repeat', ac))
      .with(REPEAT_ACTIVITY)
  }

  const stopActivity = () => {
    return request(post('activity/stop', undefined, true)
      .then(stoppedActivity => dispatch(activityStopped(stoppedActivity)))
    ).with(STOP_ACTIVITY)
  }

  const saveActivity = (changedActivity) => {
    return request(put(`activity/${changedActivity.id}`, changedActivity, true))
      .with(SAVE_ACTIVITY)
  }

  const deleteActivity = id => {
    return request(del(`activity/${id}`, undefined, true)
      .then(deletedActivity => dispatch(activityDeleted(deletedActivity)))
    ).with(DELETE_ACTIVITY)
  }

  const switchActivity = name => {
    return stopActivity()
      .then(() => startActivity(name))
  }

  const continueActivity = name => {
    return startActivity(name)
  }

  const loadActivity = id => {
    request(get(`activities/${id}`, undefined, true)
      .then(activity => dispatch(activityLoaded(activity)))
    ).with(LOAD_ACTIVITY)
  }

  const clearActivity = () => {
    dispatch(activityCleared())
  }

  return <ActivityContext.Provider value={{
    ...state,
    startActivity,
    repeatActivity,
    loadRunning,
    stopActivity,
    saveActivity,
    deleteActivity,
    switchActivity,
    continueActivity,
    loadActivitiesInRange,
    loadActivity,
    loadUsedTags,
    clearActivity,

    isLoadingActivitiesInRange
  }}>
    {children}
  </ActivityContext.Provider>

}

export const useActivity = () => useContext(ActivityContext)
