import {ACTIVITIES_IN_RANGE_LOADED} from './actions'

export const initialState = {
  activities: [],
  selectedActivity: undefined,
  running: undefined,
  usedTags: []
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case ACTIVITIES_IN_RANGE_LOADED:
      return {
        activities: action.payload.entries
      }
    default:
      return state
  }
}
