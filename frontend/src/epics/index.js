import { concat, EMPTY, merge, of as of$, timer } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import {
  catchError as catchError$,
  filter as filter$,
  flatMap as flatMap$,
  map as map$,
  switchMap as switchMap$,
  withLatestFrom as withLatestFrom$
} from 'rxjs/operators'
import { combineEpics, ofType as ofType$ } from 'redux-observable'
import {
  activitiesLoaded,
  activitiesOfRangeLoaded,
  activityDeleted,
  activitySaved,
  activityStarted,
  activityStopped,
  addNetworkActivity,
  ADJUST_ACTIVITIES,
  CONTINUE_ACTIVITY,
  CREATE_LOG,
  DELETE_ACTIVITY,
  deselectActivity,
  lastUpdated,
  LOAD_ACTIVITIES,
  LOAD_ACTIVITIES_OF_RANGE,
  LOAD_LOGS,
  LOAD_OVERTIME,
  LOAD_RUNNING_ACTIVITY,
  loadActivities,
  loadOvertime,
  loadRunningActivity,
  logCreated,
  logsLoaded,
  logUpdated,
  overtimeLoaded,
  removeNetworkActivity,
  runningActivityLoaded,
  SAVE_ACTIVITY,
  showErrorMessage,
  START_ACTIVITY,
  START_POLLING,
  startActivity,
  STOP_ACTIVITY,
  SWITCH_ACTIVITY,
  UPDATE_LOG,
} from '../actions'
import moment from 'moment/moment'
import { goBack } from 'connected-react-router'

const BASE_URL = process.env.REACT_APP_API_HOST

const url = (endpoint) => {
  return `${BASE_URL}/${endpoint}`
}

const authorizationHeader = () => {
  const token = localStorage.getItem('access_token')

  return {
    Authorization: `Bearer ${token}`
  }
}

const get = (endpoint) => {
  return ajax.getJSON(url(endpoint), authorizationHeader())
}

export const head = (endpoint) => {
  return ajax({
    method: 'HEAD',
    url: url(endpoint),
    headers: { ...authorizationHeader() }
  })
}

const post = (endpoint, body) => {
  return ajax({
    method: 'POST',
    url: url(endpoint),
    body,
    headers: { ...authorizationHeader(), 'Content-Type': 'application/json' },
    crossDomain: true
  })
}

const put = (endpoint, body) => {
  return ajax({
    method: 'PUT',
    url: url(endpoint),
    body,
    headers: { ...authorizationHeader(), 'Content-Type': 'application/json' },
    crossDomain: true
  })
}

const del = (endpoint) => {
  return ajax({
    method: 'DELETE',
    url: url(endpoint),
    headers: { ...authorizationHeader(), 'Content-Type': 'application/json' },
    crossDomain: true
  })
}

const errors = (requestName, actionFailed) => error => {
  console.error(error)
  return concat(
    of$(showErrorMessage(`${requestName} failed with status: ${error.status}`)),
    of$(actionFailed())
  )
}

export const toActivityWithMoment = activity => ({
  ...activity,
  start: moment.utc(activity.start).local(),
  end: activity.end && moment.utc(activity.end).local()
})

const now = () => moment.utc()

const loadActivitiesEpic = action$ => (
  action$.pipe(
    ofType$(LOAD_ACTIVITIES),
    switchMap$(() => concat(
      of$(addNetworkActivity(LOAD_ACTIVITIES)),
      get('activities').pipe(
        flatMap$(activitiesByWeek => concat(
          of$(lastUpdated(now())),
          of$(activitiesLoaded(activitiesByWeek)),
          of$(removeNetworkActivity(LOAD_ACTIVITIES))
        ))
      ),
    )),
    catchError$(errors('Load activities', () => removeNetworkActivity(LOAD_ACTIVITIES)))
  )
)

const startActivityEpic = action$ => (
  action$.ofType(START_ACTIVITY)
    .pipe(
      switchMap$(({ payload }) => concat(
        of$(addNetworkActivity(START_ACTIVITY)),
        post('activity', { name: payload }).pipe(
          map$(result => result.response),
          map$(toActivityWithMoment),
          flatMap$(response => concat(
            of$(lastUpdated(now())),
            of$(activityStarted(response)),
            of$(removeNetworkActivity(START_ACTIVITY))
          )))
      )),
      catchError$(errors('Start activity', () => removeNetworkActivity(START_ACTIVITY)))
    )
)

const stopActivityEpic = action$ => (
  action$.ofType(STOP_ACTIVITY)
    .pipe(
      switchMap$(() => concat(
        of$(addNetworkActivity(STOP_ACTIVITY)),
        post('activity/stop').pipe(
          map$(result => result.response),
          map$(toActivityWithMoment),
          flatMap$(response => concat(
            of$(lastUpdated(now())),
            of$(activityStopped(response)),
            of$(removeNetworkActivity(STOP_ACTIVITY))
          )))
      )),
      catchError$(errors('Stop activity', () => removeNetworkActivity(STOP_ACTIVITY)))
    )
)

const saveActivityEpic = action$ => (
  action$.pipe(
    ofType$(SAVE_ACTIVITY),
    switchMap$(({ payload }) => concat(
      of$(addNetworkActivity(SAVE_ACTIVITY)),
      of$(deselectActivity()),
      put(`activity/${payload.activity.id}`, payload.activity).pipe(
        map$(result => result.response),
        map$(toActivityWithMoment),
        flatMap$(response => concat(
          of$(lastUpdated(now())),
          of$(activityDeleted(toActivityWithMoment(payload.oldActivity))),
          of$(activitySaved(response)),
          of$(removeNetworkActivity(SAVE_ACTIVITY))
        )))
    )),
    catchError$(errors('Save activity', () => removeNetworkActivity(SAVE_ACTIVITY)))
  )
)

const deleteActivityEpic = action$ => (
  action$.ofType(DELETE_ACTIVITY)
    .pipe(
      switchMap$(({ payload }) => concat(
        of$(addNetworkActivity(DELETE_ACTIVITY)),
        of$(deselectActivity()),
        del(`activity/${payload}`).pipe(
          map$(result => result.response),
          flatMap$(response => concat(
            of$(lastUpdated(now())),
            of$(activityDeleted(toActivityWithMoment(response))),
            of$(removeNetworkActivity(DELETE_ACTIVITY))
          )))
      )),
      catchError$(errors('Delete activity', () => removeNetworkActivity(DELETE_ACTIVITY)))
    )
)

const loadOvertimeEpic = action$ => (
  action$.ofType(LOAD_OVERTIME)
    .pipe(
      switchMap$(() => concat(
        of$(addNetworkActivity(LOAD_OVERTIME)),
        get('statistics/overtime').pipe(
          flatMap$(overtime => concat(
            of$(lastUpdated(now())),
            of$(overtimeLoaded(overtime)),
            of$(removeNetworkActivity(LOAD_OVERTIME))
          )))
      )),
      catchError$(errors('Load overtime', () => removeNetworkActivity(LOAD_OVERTIME)))
    )
)

const loadRunningActivityEpic = action$ => (
  action$.pipe(
    ofType$(LOAD_RUNNING_ACTIVITY),
    switchMap$(() => concat(
      of$(addNetworkActivity(LOAD_RUNNING_ACTIVITY)),
      get('activity/running').pipe(
        flatMap$(runningActivity => concat(
          of$(lastUpdated(now())),
          of$(runningActivityLoaded(runningActivity)),
          of$(removeNetworkActivity(LOAD_RUNNING_ACTIVITY))
        )),
      ),
    )),
    catchError$(e => {
      if (e.status === 404) {
        return concat(
          of$(lastUpdated(now())),
          of$(runningActivityLoaded(undefined)),
          of$(removeNetworkActivity(LOAD_RUNNING_ACTIVITY))
        )
      } else {
        return errors('Load running activity', () => removeNetworkActivity(LOAD_RUNNING_ACTIVITY))(e)
      }
    })
  )
)

const loadLogs = action$ => (
  action$.pipe(
    ofType$(LOAD_LOGS),
    switchMap$(() => concat(
      of$(addNetworkActivity(LOAD_LOGS)),
      get('logs').pipe(
        map$(logs => logsLoaded(logs))
      ),
      of$(removeNetworkActivity(LOAD_LOGS))
    )),
    catchError$(e => {
      return errors('Load logs', () => removeNetworkActivity(LOAD_LOGS))(e)
    })
  )
)

const createLog = action$ => (
  action$.ofType(CREATE_LOG)
    .pipe(
      switchMap$(({ payload }) => concat(
        of$(addNetworkActivity(CREATE_LOG)),
        post('log', payload).pipe(
          map$(result => result.response),
          flatMap$(log => concat(
            of$(logCreated(log)),
            of$(removeNetworkActivity(CREATE_LOG)),
            of$(goBack())
          )))
      )),
      catchError$(e => {
        return errors('Create log', () => removeNetworkActivity(CREATE_LOG))(e)
      })
    )
)

const updateLog = action$ => (
  action$.ofType(UPDATE_LOG)
    .pipe(
      switchMap$(({ payload }) => concat(
        of$(addNetworkActivity(UPDATE_LOG)),
        put(`log/${payload.id}`, payload).pipe(
          map$(result => result.response),
          flatMap$(log => concat(
            of$(logUpdated(log)),
            of$(removeNetworkActivity(UPDATE_LOG)),
            of$(goBack())
          )))
      )),
      catchError$(e => {
        return errors('Update log', () => removeNetworkActivity(UPDATE_LOG))(e)
      })
    )
)

const loadActivitiesOfRange = action$ => (
  action$.pipe(
    ofType$(LOAD_ACTIVITIES_OF_RANGE),
    switchMap$(({ payload }) => concat(
      of$(addNetworkActivity(LOAD_ACTIVITIES_OF_RANGE)),
      get(`activities/${payload.from}/${payload.to}`).pipe(
        map$(result => result.response),
        flatMap$(activities => concat(
          of$(activitiesOfRangeLoaded(activities)),
          of$(removeNetworkActivity(LOAD_ACTIVITIES_OF_RANGE))
        ))
      )
    ))
  )
)

const continueActivity = action$ => (
  action$.pipe(
    ofType$(CONTINUE_ACTIVITY),
    switchMap$(({ payload }) => concat(
      of$(startActivity(payload))
    ))
  )
)

const switchActivity = action$ => (
  action$.pipe(
    ofType$(SWITCH_ACTIVITY),
    switchMap$(({ payload }) => concat(
      of$(addNetworkActivity(STOP_ACTIVITY)),
      post('activity/stop').pipe(
        map$(result => result.response),
        map$(toActivityWithMoment),
        flatMap$(response => concat(
          of$(activityStopped(response)),
          of$(removeNetworkActivity(STOP_ACTIVITY)),
          of$(startActivity(payload))
        )))
    ))
  )
)

const pollingEpic = (action$, state$) => (
  action$.pipe(
    ofType$(START_POLLING),
    switchMap$(() => timer(0, 5000).pipe(
      switchMap$(_ => head('activities').pipe(
        catchError$(() => EMPTY)
      )),
      withLatestFrom$(state$),
      switchMap$(([response, state]) => {
        const lastModifiedDate = moment.utc(response.xhr.getResponseHeader('last-modified'));
        const lastUpdated = state.activity.lastUpdated;
        return of$({})
          .pipe(
            filter$(() => lastModifiedDate.isSameOrAfter(lastUpdated)),
            switchMap$(() => merge(
              of$(loadActivities()),
              of$(loadRunningActivity()),
              of$(loadOvertime())
            )),
            catchError$(() => of$({}))
          )
      })
    )),
  )
)

const adjustActivities = action$ => (
  action$.pipe(
    ofType$(ADJUST_ACTIVITIES),
    switchMap$(() => concat(
      of$(addNetworkActivity(ADJUST_ACTIVITIES)),
      get('activities/adjust').pipe(
        map$(() => removeNetworkActivity(ADJUST_ACTIVITIES))
      )
    )),
    catchError$(e => {
      return errors('ADJUST activities', () => removeNetworkActivity(ADJUST_ACTIVITIES))(e)
    })
  )
)

export const rootEpic = combineEpics(
  loadActivitiesEpic,
  startActivityEpic,
  stopActivityEpic,
  saveActivityEpic,
  deleteActivityEpic,
  loadOvertimeEpic,
  loadRunningActivityEpic,
  loadLogs,
  createLog,
  updateLog,
  loadActivitiesOfRange,
  continueActivity,
  switchActivity,
  pollingEpic,
  adjustActivities
)
