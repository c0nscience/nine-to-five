import {
  ACTIVITIES_LOADED,
  ACTIVITY_DELETED,
  ACTIVITY_SAVED,
  ACTIVITY_STARTED,
  ACTIVITY_STOP_FAILURE,
  ACTIVITY_STOPPED,
  DELETE_ACTIVITY,
  DELETE_ACTIVITY_FAILED,
  DESELECT_ACTIVITY,
  LOAD_ACTIVITIES,
  LOAD_ACTIVITIES_FAILED,
  SAVE_ACTIVITY,
  SAVE_ACTIVITY_FAILED,
  SELECT_ACTIVITY,
  START_ACTIVITY,
  START_ACTIVITY_FAILED,
  STOP_ACTIVITY
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
    case STOP_ACTIVITY:
      return {
        ...state,
        loading: true
      }
    case ACTIVITY_STOPPED:
      return {
        ...state,
        loading: false,
        activities: state.activities.map(activity => (
          activity.id === action.payload.id ?
            action.payload :
            activity
        ))
      }
    case ACTIVITY_STOP_FAILURE:
      return {
        ...state,
        loading: false
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
    case SAVE_ACTIVITY:
      return {
        ...state,
        loading: true
      }
    case ACTIVITY_SAVED:
      return {
        ...state,
        loading: false,
        activities: state.activities.map(activity => (
          activity.id === action.payload.id ?
            action.payload :
            activity
        ))
      }
    case SAVE_ACTIVITY_FAILED:
      return {
        ...state,
        loading: false
      }
    case DELETE_ACTIVITY:
      return {
        ...state,
        loading: true
      }
    case ACTIVITY_DELETED:
      const deletedActivityIndex = state.activities.findIndex(activity => activity.id === action.payload.id)

      return {
        ...state,
        loading: false,
        activities: [
          ...state.activities.slice(0, deletedActivityIndex),
          ...state.activities.slice(deletedActivityIndex + 1)
        ]
      }
    case DELETE_ACTIVITY_FAILED:
      return {
        ...state,
        loading: false
      }
    default:
      return state
  }
}
