const initialState = {
  currentActivity: ''
}

const CURRENT_UPDATE = 'CURRENT_UPDATE'
const RESET_CURRENT = 'RESET_CURRENT'

export const updateCurrent = (value) =>
  ({type: CURRENT_UPDATE, payload: value})

export const resetCurrent = () =>
  ({type: RESET_CURRENT})

export const startActivity = (currentActivity) => (dispatch) => {
  return fetch('https://httpstat.us/201').then(
    started => dispatch(resetCurrent()),
    error => console.log(error)
  )
}

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
    default:
      return state
  }
}
