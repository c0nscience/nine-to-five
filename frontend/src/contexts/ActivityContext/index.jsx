import React, {createContext, useContext, useReducer} from 'react'
import {createApi} from 'api'
import {
  activitiesInRangeLoaded,
  activityStarted,
  LOAD_ACTIVITIES_IN_RANGE,
  LOAD_USED_TAGS,
  START_ACTIVITY,
  usedTagsLoaded
} from './actions'
import {initialState, reducer} from 'contexts/ActivityContext/reducer'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {useAuth} from 'contexts/AuthenticationContext'
import {
  activityLoaded,
  LOAD_ACTIVITY,
  LOAD_RUNNING_ACTIVITY,
  runningActivityLoaded,
  SAVE_ACTIVITY
} from 'contexts/ActivityContext/actions'

const ActivityContext = createContext()

export const ActivityProvider = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {getTokenSilently} = useAuth()
  const {addNetworkActivity, removeNetworkActivity} = useNetworkActivity()
  const {get, post, put, del, request} = createApi(getTokenSilently, addNetworkActivity, removeNetworkActivity)

  const loadRunning = () => {
    request(get('activity/running')
      .then(runningActivity => dispatch(runningActivityLoaded(runningActivity)))
    ).with(LOAD_RUNNING_ACTIVITY)
  }

  //TODO this should move into an own TagsContext, which then also can take care of providing methods to maintain tags like changing color and such
  const loadUsedTags = () => {
    request(get('activities/tags')
      .then(tags => dispatch(usedTagsLoaded(tags))))
      .with(LOAD_USED_TAGS)
  }

  // useEffect(() => {
  //   // loadUsedTags()
  //   loadRunning()
  // }, [])

  const loadActivitiesInRange = (from, to, signal) => {
    request(get(`activities/${from.toISODate()}/${to.toISODate()}`, signal)
      .then(activities => dispatch(activitiesInRangeLoaded(activities)))
    ).with(LOAD_ACTIVITIES_IN_RANGE)
  }

  const startActivity = activity => {
    return request(post('activity', activity)
      .then(activity => dispatch(activityStarted(activity)))
    ).with(START_ACTIVITY)
  }
  //
  // const stopActivity = () => {
  //   return request(post('activity/stop')
  //     .then(stoppedActivity => dispatch(activityStopped(stoppedActivity)))
  //   ).with(STOP_ACTIVITY)
  // }

  const saveActivity = (changedActivity) => {
    return request(put(`activity/${changedActivity.id}`, changedActivity))
      .with(SAVE_ACTIVITY)
  }

  // const deleteActivity = id => {
  //   dispatch(deselectActivityAction())
  //   request(del(`activity/${id}`)
  //     .then(deletedActivity => dispatch(activityDeleted(deletedActivity))))
  //     .with(DELETE_ACTIVITY)
  // }

  // const switchActivity = name => {
  //   stopActivity()
  //     .then(() => startActivity(name))
  // }

  // const continueActivity = name => {
  //   startActivity(name)
  // }

  const loadActivity = id => {
    request(get(`activities/${id}`)
      .then(activity => dispatch(activityLoaded(activity)))
    ).with(LOAD_ACTIVITY)
  }

  return <ActivityContext.Provider value={{
    ...state,
    startActivity,
    loadRunning,
    // stopActivity,
    // selectActivity,
    // deselectActivity,
    saveActivity,
    // deleteActivity,
    // switchActivity,
    // continueActivity,
    loadActivitiesInRange,
    loadActivity,
    loadUsedTags
  }}>
    {children}
  </ActivityContext.Provider>

}

export const useActivity = () => useContext(ActivityContext)
