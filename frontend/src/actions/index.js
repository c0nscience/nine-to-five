export const LOAD_ACTIVITIES = 'LOAD_ACTIVITIES'
export const ACTIVITIES_LOADED = 'ACTIVITIES_LOADED'

export const loadActivities = () =>
  ({ type: LOAD_ACTIVITIES })

export const activitiesLoaded = activities =>
  ({ type: ACTIVITIES_LOADED, payload: activities })

export const START_ACTIVITY = 'START_ACTIVITY'
export const ACTIVITY_STARTED = 'ACTIVITY_STARTED'

export const startActivity = (currentActivity) =>
  ({ type: START_ACTIVITY, payload: currentActivity })

export const activityStarted = (startedActivity) =>
  ({ type: ACTIVITY_STARTED, payload: startedActivity })

export const STOP_ACTIVITY = 'STOP_ACTIVITY'
export const ACTIVITY_STOPPED = 'ACTIVITY_STOPPED'

export const stopActivity = () =>
  ({ type: STOP_ACTIVITY })

export const activityStopped = stoppedActivity =>
  ({ type: ACTIVITY_STOPPED, payload: stoppedActivity })

export const SAVE_ACTIVITY = 'SAVE_ACTIVITY'
export const ACTIVITY_SAVED = 'ACTIVITY_SAVED'

export const saveActivity = activity =>
  ({ type: SAVE_ACTIVITY, payload: activity })

export const activitySaved = activity =>
  ({ type: ACTIVITY_SAVED, payload: activity })

export const DELETE_ACTIVITY = 'DELETE_ACTIVITY'
export const ACTIVITY_DELETED = 'ACTIVITY_DELETED'

export const deleteActivity = id =>
  ({ type: DELETE_ACTIVITY, payload: id })

export const activityDeleted = deletedActivity =>
  ({ type: ACTIVITY_DELETED, payload: deletedActivity })

export const SELECT_ACTIVITY = 'SELECT_ACTIVITY'
export const DESELECT_ACTIVITY = 'DESELECT_ACTIVITY'

export const selectActivity = activity =>
  ({ type: SELECT_ACTIVITY, payload: activity })

export const deselectActivity = () =>
  ({ type: DESELECT_ACTIVITY })

export const CLEAR_ERROR_MESSAGE = 'CLEAR_ERROR_MESSAGE'
export const SHOW_ERROR_MESSAGE = 'SHOW_ERROR_MESSAGE'

export const clearErrorMessage = () =>
  ({ type: CLEAR_ERROR_MESSAGE })

export const showErrorMessage = errorMessage =>
  ({ type: SHOW_ERROR_MESSAGE, payload: errorMessage })

export const LOAD_OVERTIME = 'LOAD_OVERTIME'
export const OVERTIME_LOADED = 'OVERTIME_LOADED'

export const loadOvertime = () =>
  ({ type: LOAD_OVERTIME })

export const overtimeLoaded = overtime =>
  ({ type: OVERTIME_LOADED, payload: overtime })

export const ADD_NETWORK_ACTIVITY = 'ADD_NETWORK_ACTIVITY'
export const REMOVE_NETWORK_ACTIVITY = 'REMOVE_NETWORK_ACTIVITY'

export const addNetworkActivity = networkActivity =>
  ({ type: ADD_NETWORK_ACTIVITY, payload: networkActivity })

export const removeNetworkActivity = networkActivity =>
  ({ type: REMOVE_NETWORK_ACTIVITY, payload: networkActivity })

export const LOAD_RUNNING_ACTIVITY = 'LOAD_RUNNING_ACTIVITY'
export const RUNNING_ACTIVITY_LOADED = 'RUNNING_ACTIVITY_LOADED'

export const loadRunningActivity = () =>
  ({ type: LOAD_RUNNING_ACTIVITY })

export const runningActivityLoaded = runningActivity =>
  ({ type: RUNNING_ACTIVITY_LOADED, payload: runningActivity })
