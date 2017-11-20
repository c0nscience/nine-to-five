import { CALL_API, API_REQUEST_ENDED } from '../middleware/api'

const API_REQUEST = 'API_REQUEST'

const CURRENT_UPDATE = 'CURRENT_UPDATE'
const RESET_CURRENT = 'RESET_CURRENT'

const ACTIVITIES_LOADED = 'ACTIVITIES_LOADED'
const ACTIVITIES_FAILURE = 'ACTIVITIES_FAILURE'

const ACTIVITY_STARTED = 'ACTIVITY_STARTED'
const ACTIVITY_START_FAILURE = 'ACTIVITY_START_FAILURE'

const ACTIVITY_STOPPED = 'ACTIVITY_STOPPED'
const ACTIVITY_STOP_FAILURE = 'ACTIVITY_STOP_FAILURE'

const SELECT_ACTIVITY = 'SELECT_ACTIVITY'
const DESELECT_ACTIVITY = 'DESELECT_ACTIVITY'

const ACTIVITY_SAVED = 'ACTIVITY_SAVED'
const UPDATE_ACTIVITY_FAILED = 'UPDATE_ACTIVITY_FAILED'

export const updateCurrent = value =>
  ({ type: CURRENT_UPDATE, payload: value })

export const startActivity = (currentActivity) => ({
  [CALL_API]: {
    endpoint: 'activity',
    config: {
      method: 'post',
      mode: 'cors'
    },
    authenticated: true,
    data: { name: currentActivity },
    additionalSuccessTypes: [RESET_CURRENT],
    types: [API_REQUEST, ACTIVITY_STARTED, ACTIVITY_START_FAILURE]
  }
})

export const stopActivity = () => ({
  [CALL_API]: {
    endpoint: 'activity/stop',
    config: {
      method: 'post',
      mode: 'cors'
    },
    authenticated: true,
    additionalSuccessTypes: [RESET_CURRENT],
    types: [API_REQUEST, ACTIVITY_STOPPED, ACTIVITY_STOP_FAILURE]
  }
})

export const loadActivities = () =>
  ({
    [CALL_API]: {
      endpoint: 'activities',
      authenticated: true,
      types: [API_REQUEST, ACTIVITIES_LOADED, ACTIVITIES_FAILURE]
    }
  })

export const selectActivity = activity =>
  ({ type: SELECT_ACTIVITY, payload: activity })

export const deselectActivity = () =>
  ({ type: DESELECT_ACTIVITY })

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

export default (state = {
  loading: false,
  openEditDialog: false,
  currentActivity: '',
  selectedActivity: {},
  activities: []
}, action) => {

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
    case CURRENT_UPDATE:
      return {
        ...state,
        currentActivity: action.payload
      }
    case RESET_CURRENT:
      return {
        ...state,
        currentActivity: ''
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
      return {
        currentActivity: '',
        activities: []
      }
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
    default:
      return state
  }
}
