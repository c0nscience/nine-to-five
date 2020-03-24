import {
  ACTIVITIES_LOADED,
  ACTIVITY_DELETED,
  ACTIVITY_SAVED,
  ACTIVITY_STARTED,
  ACTIVITY_STOPPED,
  DESELECT_ACTIVITY,
  LAST_UPDATED,
  LOG_CREATED,
  LOG_UPDATED,
  LOGS_LOADED,
  OVERTIME_LOADED,
  RUNNING_ACTIVITY_LOADED,
  SELECT_ACTIVITY
} from './actions'
import {DateTime, Duration} from 'luxon'

export const initialState = {
  selectedActivity: undefined,
  activitiesByWeek: {},
  selectedLog: undefined,
  running: undefined,
  overtimes: [],
  logs: [],
  lastUpdated: DateTime.local()
}

const reduceActivitiesByWeek = state => (activity, reducer) => {
  const localStart = DateTime.fromISO(activity.start, {zone: 'utc'}).toLocal()
  const weekDate = localStart.toISOWeekDate().slice(0, -2)
  const dayDate = localStart.toISODate()
  const week = state.activitiesByWeek[weekDate] || {
    totalDuration: Duration.fromMillis(0),
    days: {}
  }

  const day = week.days[dayDate] || {
    totalDuration: Duration.fromMillis(0),
    activities: []
  }

  const activities = reducer(day.activities, activity)

  const days = {
    ...week.days,
    [dayDate]: {
      ...day,
      totalDuration: activities.reduce((result, activity) => {
        const start = DateTime.fromISO(activity.start, {zone: 'utc'}).toLocal()
        const end = activity.end && DateTime.fromISO(activity.end, {zone: 'utc'}).toLocal() || DateTime.local()
        const diff = end.diff(start)
        return result.plus(diff)
      }, Duration.fromMillis(0)),
      activities: activities
    }
  }


  const totalDuration = Object.values(days)
    .reduce((result, day) => {
      return result.plus(Duration.fromISO(day.totalDuration))
    }, Duration.fromMillis(0))
  return {
    ...state.activitiesByWeek,
    [weekDate]: {
      ...week,
      totalDuration,
      days: days
    }
  }
}

export const reducer = (state = initialState, action) => {
  const activitiesByWeekReducer = reduceActivitiesByWeek(state)

  switch (action.type) {
    case ACTIVITIES_LOADED:
      return {
        ...state,
        activitiesByWeek: action.payload
      }
    case ACTIVITY_STARTED:
      return {
        ...state,
        running: action.payload,
        activitiesByWeek: activitiesByWeekReducer(
          action.payload,
          (dayActivities, activity) => ([activity, ...dayActivities]))
      }
    case ACTIVITY_STOPPED: {
      return {
        ...state,
        running: undefined,
        activitiesByWeek: activitiesByWeekReducer(
          action.payload,
          (dayActivities, activity) => dayActivities.map(a => (
            a.id === activity.id ?
              activity : a
          )))
      }
    }
    case SELECT_ACTIVITY:
      return {
        ...state,
        selectedActivity: action.payload
      }
    case DESELECT_ACTIVITY:
      return {
        ...state,
        selectedActivity: undefined
      }
    case ACTIVITY_SAVED:
      return {
        ...state,
        running: action.payload.end === undefined ? action.payload : state.running,
        activitiesByWeek: activitiesByWeekReducer(
          action.payload,
          (dayActivities, activity) => ([activity, ...dayActivities])
        )
      }
    case ACTIVITY_DELETED:
      return {
        ...state,
        running: state.running && state.running.id === action.payload.id ? undefined : state.running,
        activitiesByWeek: activitiesByWeekReducer(
          action.payload,
          (dayActivities, activity) => {
            const index = dayActivities.findIndex(a => a.id === activity.id)
            return [
              ...dayActivities.slice(0, index),
              ...dayActivities.slice(index + 1)
            ]
          }
        )
      }
    case OVERTIME_LOADED:
      return {
        ...state,
        overtimes: action.payload
      }
    case RUNNING_ACTIVITY_LOADED:
      return {
        ...state,
        running: action.payload
      }
    case LOGS_LOADED:
      return {
        ...state,
        logs: action.payload
      }
    case LOG_CREATED:
      return {
        ...state,
        logs: [
          ...state.logs,
          action.payload
        ]
      }
    case LOG_UPDATED:
      return {
        ...state,
        logs: state.logs.map(l => l.id === action.payload.id ? action.payload : l)
      }
    case LAST_UPDATED:
      return {
        ...state,
        lastUpdated: action.payload
      }
    default:
      return state
  }
}
