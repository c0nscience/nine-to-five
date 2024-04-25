import {
  ACTIVITIES_IN_RANGE_LOADED,
  ACTIVITY_DELETED,
  ACTIVITY_LOADED,
  ACTIVITY_STOPPED,
  RUNNING_ACTIVITY_LOADED,
  USED_TAGS_LOADED
} from './actions'
import {ACTIVITY_CLEARED} from 'contexts/ActivityContext/actions'

export const initialState = {
  activities: [],
  activity: undefined,
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
      return {
        ...state,
        running: undefined
      }
    case ACTIVITY_DELETED:
      const idToDelete = action.payload.id
      let newState = state
      if (state.running && state.running.id === idToDelete) {
        newState = {
          ...state,
          running: undefined
        }
      }

      if (state.activities) {
        newState = {
          ...newState,
          activities: state.activities.filter(a => a.id !== idToDelete)
        }
      }

      return newState
    case ACTIVITY_CLEARED:
      return {
        ...state,
        activity: undefined
      }
    default:
      return state
  }
}
