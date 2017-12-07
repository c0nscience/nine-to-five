import { CALL_API } from '../middleware/api'

export const API_REQUEST = 'API_REQUEST'

export const LOAD_ACTIVITIES = 'LOAD_ACTIVITIES'
export const ACTIVITIES_LOADED = 'ACTIVITIES_LOADED'
export const LOAD_ACTIVITIES_FAILED = 'LOAD_ACTIVITIES_FAILED'

export const START_ACTIVITY = 'START_ACTIVITY'
export const ACTIVITY_STARTED = 'ACTIVITY_STARTED'
export const START_ACTIVITY_FAILED = 'START_ACTIVITY_FAILED'

export const STOP_ACTIVITY = 'STOP_ACTIVITY'
export const ACTIVITY_STOPPED = 'ACTIVITY_STOPPED'
export const ACTIVITY_STOP_FAILURE = 'ACTIVITY_STOP_FAILURE'

export const SELECT_ACTIVITY = 'SELECT_ACTIVITY'
export const DESELECT_ACTIVITY = 'DESELECT_ACTIVITY'

export const ACTIVITY_SAVED = 'ACTIVITY_SAVED'
export const UPDATE_ACTIVITY_FAILED = 'UPDATE_ACTIVITY_FAILED'

export const ACTIVITY_DELETED = 'ACTIVITY_DELETED'
export const DELETE_ACTIVITY_FAILED = 'DELETE_ACTIVITY_FAILED'

export const CLEAR_ERROR_MESSAGE = 'CLEAR_ERROR_MESSAGE'
export const SHOW_ERROR_MESSAGE = 'SHOW_ERROR_MESSAGE'

export const loadActivities = () =>
  ({ type: LOAD_ACTIVITIES })

export const activitiesLoaded = activities =>
  ({ type: ACTIVITIES_LOADED, payload: activities })

export const loadActivitiesFailed = () =>
  ({ type: LOAD_ACTIVITIES_FAILED })

export const startActivity = (currentActivity) =>
  ({ type: START_ACTIVITY, payload: currentActivity })

export const activityStarted = (startedActivity) =>
  ({ type: ACTIVITY_STARTED, payload: startedActivity })

export const startActivityFailed = () =>
  ({ type: START_ACTIVITY_FAILED })

export const stopActivity = () =>
  ({ type: STOP_ACTIVITY })

export const activityStopped = stoppedActivity =>
  ({ type: ACTIVITY_STOPPED, payload: stoppedActivity })

export const stoppingActivityFailed = () =>
  ({ type: ACTIVITY_STOP_FAILURE })

export const saveSelectedActivity = selectedActivity => ({
  [CALL_API]: {
    endpoint: 'activity/' + selectedActivity.id,
    config: {
      method: 'put',
      mode: 'cors'
    },
    data: {...selectedActivity},
    authenticated: true,
    additionalSuccessTypes: [DESELECT_ACTIVITY],
    types: [API_REQUEST, ACTIVITY_SAVED, UPDATE_ACTIVITY_FAILED]
  }
})

export const deleteActivity = id => ({
  [CALL_API]: {
    endpoint: 'activity/' + id,
    config: {
      method: 'delete',
      mode: 'cors'
    },
    authenticated: true,
    additionalSuccessTypes: [DESELECT_ACTIVITY],
    types: [API_REQUEST, ACTIVITY_DELETED, DELETE_ACTIVITY_FAILED]
  }
})

export const selectActivity = activity =>
  ({ type: SELECT_ACTIVITY, payload: activity })

export const deselectActivity = () =>
  ({ type: DESELECT_ACTIVITY })

export const clearErrorMessage = () =>
  ({ type: CLEAR_ERROR_MESSAGE })

export const showErrorMessage = errorMessage =>
  ({ type: SHOW_ERROR_MESSAGE, payload: errorMessage })
