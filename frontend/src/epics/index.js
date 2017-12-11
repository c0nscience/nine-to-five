import { Observable } from 'rxjs'
import { combineEpics } from 'redux-observable'
import {
  activitiesLoaded,
  activityDeleted,
  activitySaved,
  activityStarted,
  activityStopped,
  DELETE_ACTIVITY,
  deleteActivityFailed,
  deselectActivity,
  LOAD_ACTIVITIES,
  LOAD_OVERTIME,
  loadActivitiesFailed,
  overtimeLoaded,
  SAVE_ACTIVITY,
  saveActivityFailed,
  showErrorMessage,
  START_ACTIVITY,
  startActivityFailed,
  STOP_ACTIVITY,
  stoppingActivityFailed
} from '../actions'

const BASE_URL = process.env.REACT_APP_API_HOST

const url = (endpoint) => {
  return `${BASE_URL}/${endpoint}`
}

const authenticationHeader = () => {
  const token = localStorage.getItem('access_token')

  return {
    Authorization: `Bearer ${token}`
  }
}

const get = (endpoint) => {
  return Observable.ajax.getJSON(url(endpoint), authenticationHeader())
}

const post = (endpoint, body) => {
  return Observable.ajax({
    method: 'POST',
    url: url(endpoint),
    body,
    headers: { ...authenticationHeader(), 'Content-Type': 'application/json' },
    crossDomain: true
  })
}

const put = (endpoint, body) => {
  return Observable.ajax({
    method: 'PUT',
    url: url(endpoint),
    body,
    headers: { ...authenticationHeader(), 'Content-Type': 'application/json' },
    crossDomain: true
  })
}

const del = (endpoint) => {
  return Observable.ajax({
    method: 'DELETE',
    url: url(endpoint),
    headers: { ...authenticationHeader(), 'Content-Type': 'application/json' },
    crossDomain: true
  })
}

const loadActivitiesEpic = action$ => (
  action$.ofType(LOAD_ACTIVITIES)
    .switchMap(() => get('activities')
      .map(activities => activitiesLoaded(activities)))
    .catch(error => {
      return Observable.of(showErrorMessage(`Request failed with status: ${error.status}`), loadActivitiesFailed())
    })
)

const startActivityEpic = action$ => (
  action$.ofType(START_ACTIVITY)
    .switchMap(({ payload }) => post('activity', { name: payload })
      .map(result => result.response)
      .map(response => activityStarted(response)))
    .catch(error => {
      return Observable.of(showErrorMessage(`Request failed with status: ${error.status}`), startActivityFailed())
    })
)

const stopActivityEpic = action$ => (
  action$.ofType(STOP_ACTIVITY)
    .switchMap(() => post('activity/stop')
      .map(result => result.response)
      .map(response => activityStopped(response)))
    .catch(error => {
      return Observable.of(showErrorMessage(`Request failed with status: ${error.status}`), stoppingActivityFailed())
    })
)

const saveActivityEpic = action$ => (
  action$.ofType(SAVE_ACTIVITY)
    .switchMap(({ payload }) => Observable.concat(
      Observable.of(deselectActivity()),
      put(`activity/${payload.id}`, payload)
        .map(result => result.response)
        .map(response => activitySaved(response))
    ))
    .catch(error => {
      return Observable.of(showErrorMessage(`Request failed with status: ${error.status}`), saveActivityFailed())
    })
)

const deleteActivityEpic = action$ => (
  action$.ofType(DELETE_ACTIVITY)
    .switchMap(({ payload }) => Observable.concat(
      Observable.of(deselectActivity()),
      del(`activity/${payload}`)
        .map(result => result.response)
        .map(response => activityDeleted(response))
    ))
    .catch(error => {
      return Observable.of(showErrorMessage(`Request failed with status: ${error.status}`), deleteActivityFailed())
    })
)

const loadOvertimeEpic = action$ => (
  action$.ofType(LOAD_OVERTIME)
    .switchMap(() => get('statistics/overtime')
      .map(overtime => overtimeLoaded(overtime)))
)

export const rootEpic = combineEpics(
  loadActivitiesEpic,
  startActivityEpic,
  stopActivityEpic,
  saveActivityEpic,
  deleteActivityEpic,
  loadOvertimeEpic
)
