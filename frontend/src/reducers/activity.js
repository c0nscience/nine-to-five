import { API_REQUEST_ENDED } from '../middleware/api'
import {
  ACTIVITIES_LOADED,
  ACTIVITY_DELETED,
  ACTIVITY_SAVED,
  ACTIVITY_STARTED,
  ACTIVITY_STOPPED,
  API_REQUEST,
  DESELECT_ACTIVITY,
  SELECT_ACTIVITY
} from '../actions'

const initialState = {
  loading: false,
  openEditDialog: false,
  openCreateDialog: false,
  selectedActivity: {},
  activities: []
}

export default (state = initialState, action) => {

  switch (action.type) {
    case API_REQUEST:
      return {
        ...state,
        loading: true
      }
    case API_REQUEST_ENDED:
      return {
        ...state,
        loading: false
      }
    case ACTIVITIES_LOADED:
      return {
        ...state,
        activities: action.response
      }
    case ACTIVITY_STARTED:
      return {
        ...state,
        activities: [
          action.response,
          ...state.activities
        ]
      }
    case ACTIVITY_STOPPED:
      return {
        ...state,
        activities: state.activities.map(activity => (
          activity.id === action.response.id ?
            action.response :
            activity
        ))
      }
    case 'LOGOUT_SUCCESS':
      return initialState
    case SELECT_ACTIVITY:
      return {
        ...state,
        openEditDialog: true,
        selectedActivity: action.payload
      }
    case DESELECT_ACTIVITY:
      return {
        ...state,
        openEditDialog: false
      }
    case ACTIVITY_SAVED:
      return {
        ...state,
        activities: state.activities.map(activity => (
          activity.id === action.response.id ?
            action.response :
            activity
        ))
      }
    case ACTIVITY_DELETED:
      const deletedActivityIndex = state.activities.findIndex(activity => activity.id === action.response.id)

      return {
        ...state,
        activities: [
          ...state.activities.slice(0, deletedActivityIndex),
          ...state.activities.slice(deletedActivityIndex + 1)
        ]
      }
    default:
      return state
  }
}
