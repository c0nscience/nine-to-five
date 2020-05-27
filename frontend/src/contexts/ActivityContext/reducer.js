import {ACTIVITIES_IN_RANGE_LOADED, ACTIVITY_LOADED, USED_TAGS_LOADED} from './actions'

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
    default:
      return state
  }
}
