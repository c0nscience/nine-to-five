export const LOAD_ACTIVITIES = 'LOAD_ACTIVITIES'
export const LOAD_ACTIVITIES_IN_RANGE = 'LOAD_ACTIVITIES_IN_RANGE'
export const ACTIVITIES_LOADED = 'ACTIVITIES_LOADED'
export const ACTIVITIES_IN_RANGE_LOADED = 'ACTIVITIES_IN_RANGE_LOADED'

export const activitiesLoaded = activities =>
  ({type: ACTIVITIES_LOADED, payload: activities})
export const activitiesInRangeLoaded = activities =>
  ({type: ACTIVITIES_IN_RANGE_LOADED, payload: activities})

export const START_ACTIVITY = 'START_ACTIVITY'
export const ACTIVITY_STARTED = 'ACTIVITY_STARTED'

export const activityStarted = (startedActivity) =>
  ({type: ACTIVITY_STARTED, payload: startedActivity})

export const STOP_ACTIVITY = 'STOP_ACTIVITY'
export const ACTIVITY_STOPPED = 'ACTIVITY_STOPPED'

export const activityStopped = stoppedActivity =>
  ({type: ACTIVITY_STOPPED, payload: stoppedActivity})

export const SAVE_ACTIVITY = 'SAVE_ACTIVITY'
export const ACTIVITY_SAVED = 'ACTIVITY_SAVED'

export const activitySaved = activity =>
  ({type: ACTIVITY_SAVED, payload: activity})

export const DELETE_ACTIVITY = 'DELETE_ACTIVITY'
export const ACTIVITY_DELETED = 'ACTIVITY_DELETED'

export const activityDeleted = deletedActivity =>
  ({type: ACTIVITY_DELETED, payload: deletedActivity})

export const SELECT_ACTIVITY = 'SELECT_ACTIVITY'
export const DESELECT_ACTIVITY = 'DESELECT_ACTIVITY'

export const selectActivity = activity =>
  ({type: SELECT_ACTIVITY, payload: activity})

export const deselectActivity = () =>
  ({type: DESELECT_ACTIVITY})

export const LOAD_RUNNING_ACTIVITY = 'LOAD_RUNNING_ACTIVITY'
export const RUNNING_ACTIVITY_LOADED = 'RUNNING_ACTIVITY_LOADED'

export const runningActivityLoaded = runningActivity =>
  ({type: RUNNING_ACTIVITY_LOADED, payload: runningActivity})
