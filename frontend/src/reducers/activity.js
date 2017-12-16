import {
  ACTIVITIES_LOADED,
  ACTIVITY_DELETED,
  ACTIVITY_SAVED,
  ACTIVITY_STARTED,
  ACTIVITY_STOPPED,
  DELETE_ACTIVITY,
  DESELECT_ACTIVITY,
  LOAD_ACTIVITIES,
  LOAD_OVERTIME,
  OVERTIME_LOADED,
  SAVE_ACTIVITY,
  SELECT_ACTIVITY,
  START_ACTIVITY,
  STOP_ACTIVITY
} from '../actions'

const initialState = {
  loading: false,
  openEditDialog: false,
  openCreateDialog: false,
  selectedActivity: {},
  activities: [],
  overtimes: []
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
    case LOAD_OVERTIME:
      return {
        ...state,
        loading: true
      }
    case OVERTIME_LOADED:
      return {
        ...state,
        loading: false,
        overtimes: action.payload
      }
    default:
      return state
  }
}
