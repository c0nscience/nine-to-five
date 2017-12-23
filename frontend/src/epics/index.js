import { Observable } from 'rxjs'
import { concat as concat$ } from 'rxjs/observable/concat'
import { of as of$ } from 'rxjs/observable/of'
import { combineEpics } from 'redux-observable'
import {
  activitiesLoaded, activityDeleted, activitySaved, activityStarted, activityStopped, addNetworkActivity,
  DELETE_ACTIVITY, deselectActivity, LOAD_ACTIVITIES, LOAD_OVERTIME, overtimeLoaded, removeNetworkActivity,
  SAVE_ACTIVITY, showErrorMessage, START_ACTIVITY, STOP_ACTIVITY
} from '../actions'
import moment from 'moment/moment'

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

const errors = (requestName, actionFailed) => error => {
  console.error(error)
  return of$(showErrorMessage(`${requestName} failed with status: ${error.status}`), actionFailed())
}

const toActivityWithMoment = activity => ({
  ...activity,
  start: moment.utc(activity.start).local(),
  end: activity.end && moment.utc(activity.end).local()
})

const loadActivitiesEpic = action$ => (
  action$.ofType(LOAD_ACTIVITIES)
    .switchMap(() => concat$(
      of$(addNetworkActivity(LOAD_ACTIVITIES)),
      get('activities')
        .map(activities => ({
          activities,
          activitiesByWeek: activities.reduce((weeks, _activity) => {
          const activity = toActivityWithMoment(_activity)
          const weekDate = activity.start.format('GGGG-WW')
          const dayDate = activity.start.format('ll')

          const end = activity.end || moment()
          const diff = end.diff(activity.start)

          const week = weeks[weekDate] || {
            totalDuration: 0,
            days: {}
          }

          const day = week.days[dayDate] || {
            totalDuration : 0,
            activities: []
          }

          const days = {
            ...week.days,
            [dayDate]: {
              ...day,
              totalDuration: day.totalDuration + diff,
              activities: [
                ...day.activities,
                activity
              ]
            }
          }

          return {
            ...weeks,
            [weekDate]: {
              ...week,
              totalDuration: week.totalDuration + diff,
              days: days
            }
          }
        }, {})
        }))
        .flatMap(activitiesByWeek => concat$(
          of$(activitiesLoaded(activitiesByWeek)),
          of$(removeNetworkActivity(LOAD_ACTIVITIES))
        ))
    ))
    .catch(errors('Load activities', () => removeNetworkActivity(LOAD_ACTIVITIES)))
)

const startActivityEpic = action$ => (
  action$.ofType(START_ACTIVITY)
    .switchMap(({ payload }) => concat$(
      of$(addNetworkActivity(START_ACTIVITY)),
      post('activity', { name: payload })
        .map(result => result.response)
        .map(toActivityWithMoment)
        .flatMap(response => concat$(
          of$(activityStarted(response)),
          of$(removeNetworkActivity(START_ACTIVITY))
        ))
    ))
    .catch(errors('Start activity', () => removeNetworkActivity(START_ACTIVITY)))
)

const stopActivityEpic = action$ => (
  action$.ofType(STOP_ACTIVITY)
    .switchMap(() => concat$(
      of$(addNetworkActivity(STOP_ACTIVITY)),
      post('activity/stop')
        .map(result => result.response)
        .map(toActivityWithMoment)
        .flatMap(response => concat$(
          of$(activityStopped(response)),
          of$(removeNetworkActivity(STOP_ACTIVITY))
        ))
    ))
    .catch(errors('Stop activity', () => removeNetworkActivity(STOP_ACTIVITY)))
)

const saveActivityEpic = action$ => (
  action$.ofType(SAVE_ACTIVITY)
    .switchMap(({ payload }) => concat$(
      of$(addNetworkActivity(SAVE_ACTIVITY)),
      of$(deselectActivity()),
      put(`activity/${payload.id}`, payload)
        .map(result => result.response)
        .map(toActivityWithMoment)
        .flatMap(response => concat$(
          of$(activitySaved(response)),
          of$(removeNetworkActivity(SAVE_ACTIVITY))
        ))
    ))
    .catch(errors('Save activity', () => removeNetworkActivity(SAVE_ACTIVITY)))
)

const deleteActivityEpic = action$ => (
  action$.ofType(DELETE_ACTIVITY)
    .switchMap(({ payload }) => concat$(
      of$(addNetworkActivity(DELETE_ACTIVITY)),
      of$(deselectActivity()),
      del(`activity/${payload}`)
        .map(result => result.response)
        .flatMap(response => concat$(
          of$(activityDeleted(response)),
          of$(removeNetworkActivity(DELETE_ACTIVITY))
        ))
    ))
    .catch(errors('Delete activity', () => removeNetworkActivity(DELETE_ACTIVITY)))
)

const loadOvertimeEpic = action$ => (
  action$.ofType(LOAD_OVERTIME)
    .switchMap(() => concat$(
      of$(addNetworkActivity(LOAD_OVERTIME)),
      get('statistics/overtime')
        .flatMap(overtime => concat$(
          of$(overtimeLoaded(overtime)),
          of$(removeNetworkActivity(LOAD_OVERTIME))
        ))
    ))
    .catch(errors('Load overtime', () => removeNetworkActivity(LOAD_OVERTIME)))
)

export const rootEpic = combineEpics(
  loadActivitiesEpic,
  startActivityEpic,
  stopActivityEpic,
  saveActivityEpic,
  deleteActivityEpic,
  loadOvertimeEpic
)
