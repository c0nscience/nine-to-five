const initialState = {
  currentActivity: '',
  activities: []
}

const CURRENT_UPDATE = 'CURRENT_UPDATE'
const RESET_CURRENT = 'RESET_CURRENT'
const APPEND_STARTED = 'APPEND_STARTED'
const ACTIVITIES_LOADED = 'ACTIVITIES_LOADED'

export const updateCurrent = (value) =>
  ({type: CURRENT_UPDATE, payload: value})

export const resetCurrent = () =>
  ({type: RESET_CURRENT})

export const appendStarted = (started) =>
  ({type: APPEND_STARTED, payload: started})

export const activitiesLoaded = (activities) =>
  ({type: ACTIVITIES_LOADED, payload: activities})

export const startActivity = (currentActivity) => (dispatch) => (
  fetch('http://localhost:9000/activity', {
    method: 'post',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({name: currentActivity})
  }).then(response => (response.json()))
    .then(started => {
        dispatch(resetCurrent())
        dispatch(appendStarted(started))
      }
    ).catch(error => console.log(error))
)

export const loadActivities = () => (dispatch) => (
  fetch('http://localhost:9000/activities')
    .then(response => (response.json()))
    .then(activities => {
      dispatch(activitiesLoaded(activities))
    })
)

export default (state = initialState, action) => {

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
        activities: action.payload
      }
    default:
      return state
  }
}
