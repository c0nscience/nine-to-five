import { Observable } from 'rxjs'
import { combineEpics } from 'redux-observable'
import { activitiesLoaded, LOAD_ACTIVITIES, loadActivitiesFailed, showErrorMessage } from '../actions'

const BASE_URL = process.env.REACT_APP_API_HOST

const get = (endpoint) => {
  const token = localStorage.getItem('access_token')

  return Observable.ajax.getJSON(`${BASE_URL}/${endpoint}`, { Authorization: `Bearer ${token}` })
}

const loadActivitiesEpic = action$ => (
  action$.ofType(LOAD_ACTIVITIES)
    .switchMap(() => {
      return get('activities')
        .map(activities => activitiesLoaded(activities))
    })
    .catch(error => {
      return Observable.of(showErrorMessage(`Request failed with status: ${error.status}`), loadActivitiesFailed())
    })
)

export const rootEpic = combineEpics(loadActivitiesEpic)
