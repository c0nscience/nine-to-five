import { CLEAR_ERROR_MESSAGE, SHOW_ERROR_MESSAGE } from '../actions'

const initialState = {
  message: undefined
}

export default (state = initialState, action) => {

  switch (action.type) {
    case SHOW_ERROR_MESSAGE:
      return {
        ...state,
        message: action.payload
      }
    case CLEAR_ERROR_MESSAGE:
      return {
        ...state,
        message: undefined
      }
    default:
      return state
  }
}
