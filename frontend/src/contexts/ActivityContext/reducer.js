import {
  ACTIVITIES_IN_RANGE_LOADED,
  ACTIVITY_LOADED, ACTIVITY_STOPPED,
  RUNNING_ACTIVITY_LOADED,
  STOP_ACTIVITY,
  USED_TAGS_LOADED
} from './actions'

export const initialState = {
  activities: [],
  activity: undefined,
  selectedActivity: undefined,
  running: undefined,
  usedTags: []
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case ACTIVITIES_IN_RANGE_LOADED:
      return {
        ...state,
        activities: action.payload.entries
      }
    case ACTIVITY_LOADED:
      return {
        ...state,
        activity: action.payload
      }
    case USED_TAGS_LOADED:
      return {
        ...state,
        usedTags: action.payload
      }
    case RUNNING_ACTIVITY_LOADED:
      return {
        ...state,
        running: action.payload
      }
    case ACTIVITY_STOPPED:
      return  {
        ...state,
        running: undefined
      }
    default:
      return state
  }
}
