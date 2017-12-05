import { API_REQUEST_ENDED } from '../middleware/api'
import {
  ACTIVITIES_LOADED,
  ACTIVITY_DELETED,
  ACTIVITY_SAVED,
  ACTIVITY_STARTED,
  ACTIVITY_STOPPED,
  API_REQUEST,
  DESELECT_ACTIVITY,
  LOAD_ACTIVITIES,
  LOAD_ACTIVITIES_FAILED,
  SELECT_ACTIVITY,
  START_ACTIVITY,
  START_ACTIVITY_FAILED
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
    case LOAD_ACTIVITIES:
      return {
        ...state,
        loading: true
      }
    case ACTIVITIES_LOADED:
      return {
        ...state,
        activities: action.payload,
        loading: false
      }
    case LOAD_ACTIVITIES_FAILED:
      return {
        ...state,
        loading: false
      }
    case START_ACTIVITY:
      return {
        ...state,
        loading: true
      }
    case ACTIVITY_STARTED:
      return {
        ...state,
        loading: false,
        activities: [
          action.payload,
          ...state.activities
        ]
      }
    case START_ACTIVITY_FAILED:
      return {
        ...state,
        loading: false
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
    default:
      return state
  }
}
