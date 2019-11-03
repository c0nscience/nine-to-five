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

export const saveActivity = (activity, oldActivity) =>
  ({ type: SAVE_ACTIVITY, payload: { activity, oldActivity } })

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

export const OPEN_MENU_DRAWER = 'OPEN_MENU_DRAWER'
export const CLOSE_MENU_DRAWER = 'CLOSE_MENU_DRAWER'

export const openMenuDrawer = () =>
  ({ type: OPEN_MENU_DRAWER })

export const closeMenuDrawer = () =>
  ({ type: CLOSE_MENU_DRAWER })

export const LOAD_LOGS = 'LOAD_LOGS'
export const LOGS_LOADED = 'LOGS_LOADED'

export const loadLogs = () =>
  ({ type: LOAD_LOGS })

export const logsLoaded = logs => {
  console.log("logsLoaded")
  return ({type: LOGS_LOADED, payload: logs});
}

export const CREATE_LOG = 'CREATE_LOG'
export const LOG_CREATED = 'LOG_CREATED'
export const UPDATE_LOG = 'UPDATE_LOG'
export const LOG_UPDATED = 'LOG_UPDATED'

export const createLog = log =>
  ({ type: CREATE_LOG, payload: log })

export const logCreated = log =>
  ({ type: LOG_CREATED, payload: log })

export const updateLog = log =>
  ({ type: UPDATE_LOG, payload: log })

export const logUpdated = log =>
  ({ type: LOG_UPDATED, payload: log })

export const LOAD_ACTIVITIES_OF_RANGE = 'LOAD_ACTIVITIES_OF_RANGE'
export const ACTIVITIES_OF_RANGE_LOADED = 'ACTIVITIES_OF_RANGE_LOADED'

export const loadActivitiesOfRange = (from, to) =>
  ({ type: LOAD_ACTIVITIES_OF_RANGE, payload: {from, to} })

export const activitiesOfRangeLoaded = activities =>
  ({ type: ACTIVITIES_OF_RANGE_LOADED, payload: activities })

export const CONTINUE_ACTIVITY = 'CONTINUE_ACTIVITY'

export const continueActivity = activityName =>
  ({ type:CONTINUE_ACTIVITY, payload: activityName })

export const SWITCH_ACTIVITY = 'SWITCH_ACTIVITY'

export const switchActivity = activityName =>
  ({ type:SWITCH_ACTIVITY, payload: activityName })

export const LAST_UPDATED = 'LAST_UPDATED'

export const lastUpdated = lastUpdated =>
  ({ type: LAST_UPDATED, payload: lastUpdated })

export const START_UPDATING = 'START_UPDATING'

export const startUpdating = () =>
  ({ type: START_UPDATING })
