import {
  ACTIVITIES_IN_RANGE_LOADED,
  ACTIVITIES_LOADED,
  ACTIVITY_DELETED,
  ACTIVITY_SAVED,
  ACTIVITY_STARTED,
  ACTIVITY_STOPPED,
  DESELECT_ACTIVITY,
  RUNNING_ACTIVITY_LOADED,
  SELECT_ACTIVITY
} from './actions'
import {DateTime, Duration} from 'luxon'
import {ZERO_DURATION} from 'functions'

export const initialState = {
  selectedActivity: undefined,
  activitiesByWeek: {},
  running: undefined,
  hasMore: true
}

const updateActivityIn = (state, activity, reducer) => {
  const localStart = DateTime.fromISO(activity.start, {zone: 'utc'}).toLocal()
  const weekDate = localStart.toISOWeekDate().slice(0, -2)
  const dayDate = localStart.toISODate()
  const week = state.activitiesByWeek[weekDate] || {
    totalDuration: ZERO_DURATION(),
    days: {}
  }

  const day = week.days[dayDate] || {
    totalDuration: ZERO_DURATION(),
    activities: []
  }

  const activities = reducer(day.activities, activity)

  let days
  if (activities.length > 0) {
    days = {
      ...week.days,
      [dayDate]: {
        ...day,
        totalDuration: activities.reduce((result, activity) => {
          const start = DateTime.fromISO(activity.start, {zone: 'utc'}).toLocal()
          const end = activity.end && DateTime.fromISO(activity.end, {zone: 'utc'}).toLocal() || DateTime.local()
          const diff = end.diff(start)
          return result.plus(diff)
        }, ZERO_DURATION()),
        activities: activities
      }
    }
  } else {
    delete week.days[dayDate]
    days = week.days
  }

  if (Object.keys(days).length > 0) {
    const totalDuration = Object.values(days)
      .reduce((result, day) => {
        return result.plus(Duration.fromISO(day.totalDuration))
      }, ZERO_DURATION())
    return {
      ...state.activitiesByWeek,
      [weekDate]: {
        ...week,
        totalDuration,
        days: days
      }
    }
  } else {
    delete state.activitiesByWeek[weekDate]
    return {
      ...state.activitiesByWeek
    }
  }
}

const reduceActivitiesByWeek = state => (activity, reducer) => {
  if (Array.isArray(activity)) {
    return activity.reduce((resultingState, a) => {
      const byWeek = updateActivityIn(resultingState, a, reducer)
      return {
        ...resultingState,
        activitiesByWeek: byWeek
      }
    }, {...state})
  } else {
    return updateActivityIn(state, activity, reducer)
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
    case RUNNING_ACTIVITY_LOADED:
      return {
        ...state,
        running: action.payload
      }
    case ACTIVITIES_IN_RANGE_LOADED:
      const newState = activitiesByWeekReducer(
        action.payload.entries,
        (dayActivities, activity) => ([activity, ...dayActivities])

      )
      return {
        ...newState,
        hasMore: action.payload.remainingEntries > 0
      }
    default:
      return state
  }
}
