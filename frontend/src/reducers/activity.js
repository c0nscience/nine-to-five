import { CALL_API } from '../middleware/api'

const CURRENT_UPDATE = 'CURRENT_UPDATE'
const RESET_CURRENT = 'RESET_CURRENT'
const APPEND_STARTED = 'APPEND_STARTED'
const UPDATE_STOPPED_ACTIVITY = 'UPDATE_STOPPED_ACTIVITY'

const ACTIVITIES_REQUEST = 'ACTIVITIES_REQUEST'
const ACTIVITIES_LOADED = 'ACTIVITIES_LOADED'
const ACTIVITIES_FAILURE = 'ACTIVITIES_FAILURE'

export const updateCurrent = value =>
  ({ type: CURRENT_UPDATE, payload: value })

export const resetCurrent = () =>
  ({ type: RESET_CURRENT })

export const appendStarted = started =>
  ({ type: APPEND_STARTED, payload: started })

export const activitiesLoaded = activities =>
  ({ type: ACTIVITIES_LOADED, payload: activities })

export const updateStoppedActivity = stopped =>
  ({ type: UPDATE_STOPPED_ACTIVITY, payload: stopped })

export const startActivity = currentActivity => dispatch => {
  let token = localStorage.getItem('access_token') || null

  fetch('http://localhost:9000/activity', {
    method: 'post',
    mode: 'cors',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: currentActivity })
  }).then(response => (response.json()))
    .then(started => {
        dispatch(resetCurrent())
        dispatch(appendStarted(started))
      }
    ).catch(error => console.error(error))
}

export const stopActivity = () => (dispatch) => {
  let token = localStorage.getItem('access_token') || null

  fetch('http://localhost:9000/activity/stop', {
    method: 'post',
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(response => {
    if (response.ok) {
      return response.json()
    }
  }).then(stoppedActivity => {
    dispatch(updateStoppedActivity(stoppedActivity))
  }).catch(error => console.error(error))
}


export const loadActivities = () =>
  ({
    [CALL_API]: {
      endpoint: 'activities',
      authenticated: true,
      types: [ACTIVITIES_REQUEST, ACTIVITIES_LOADED, ACTIVITIES_FAILURE]
    }
  })

export default (state = {
  currentActivity: '',
  activities: []
}, action) => {

  switch (action.type) {
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
    case APPEND_STARTED:
      return {
        ...state,
        activities: [
          action.payload,
          ...state.activities
        ]
      }
    case ACTIVITIES_LOADED:
      return {
        ...state,
        activities: action.response
      }
    case UPDATE_STOPPED_ACTIVITY:
      return {
        ...state,
        activities: state.activities.map(activity => (
          activity.id === action.payload.id ?
            action.payload :
            activity
        ))
      }
    default:
      return state
  }
}
