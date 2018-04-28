import {
  ACTIVITIES_LOADED, ACTIVITY_DELETED, ACTIVITY_SAVED, ACTIVITY_STARTED, ACTIVITY_STOPPED, DELETE_ACTIVITY,
  DESELECT_ACTIVITY, LOAD_ACTIVITIES, LOAD_OVERTIME, LOAD_RUNNING_ACTIVITY, OVERTIME_LOADED, RUNNING_ACTIVITY_LOADED,
  SAVE_ACTIVITY,
  SELECT_ACTIVITY, START_ACTIVITY,
  STOP_ACTIVITY, OPEN_MENU_DRAWER, CLOSE_MENU_DRAWER, LOGS_LOADED, LOG_CREATED
} from '../actions'
import moment from 'moment/moment'

const initialState = {
  loading: false,
  menuDrawerOpen: false,
  openEditDialog: false,
  openCreateDialog: false,
  selectedActivity: {},
  activitiesByWeek: {},
  running: undefined,
  overtimes: [],
  logs: []
}

const reduceActivitiesByWeek = state => (activity, reducer) => {
  const weekDate = activity.start.format('GGGG-WW')
  const dayDate = activity.start.format('ll')

  const week = state.activitiesByWeek[weekDate] || {
    totalDuration: 0,
    days: {}
  }

  const day = week.days[dayDate] || {
    totalDuration: 0,
    activities: []
  }

  const activities = reducer(day.activities, activity)

  const days = {
    ...week.days,
    [dayDate]: {
      ...day,
      totalDuration: activities.reduce((result, activity) => {
        const end = activity.end || moment()
        const diff = end.diff(activity.start)
        return result + diff
      }, 0),
      activities: activities
    }
  }

  return {
    ...state.activitiesByWeek,
    [weekDate]: {
      ...week,
      totalDuration: Object.values(days).reduce((result, day) => (result + day.totalDuration), 0),
      days: days
    }
  }
}

export default (state = initialState, action) => {
  const activitiesByWeekReducer = reduceActivitiesByWeek(state)

  switch (action.type) {
    case LOAD_ACTIVITIES:
      return {
        ...state,
        loading: true
      }
    case ACTIVITIES_LOADED:
      return {
        ...state,
        activitiesByWeek: action.payload,
        loading: false
      }
    case START_ACTIVITY:
      return {
        ...state,
        loading: true
      }
    case ACTIVITY_STARTED:
      return {
        ...state,
        loading: false,
        running: action.payload,
        activitiesByWeek: activitiesByWeekReducer(
          action.payload,
          (dayActivities, activity) => ([activity, ...dayActivities]))
      }
    case STOP_ACTIVITY:
      return {
        ...state,
        loading: true
      }
    case ACTIVITY_STOPPED: {
      return {
        ...state,
        loading: false,
        running: undefined,
        activitiesByWeek: activitiesByWeekReducer(
          action.payload,
          (dayActivities, activity) => dayActivities.map(a => (
            a.id === activity.id ?
              activity : a
          ))),
      }
    }
    case 'LOGOUT_SUCCESS':
      return initialState
    case SELECT_ACTIVITY:
      return {
        ...state,
        openEditDialog: true,
        selectedActivity: action.payload
      }
    case DESELECT_ACTIVITY:
      return {
        ...state,
        openEditDialog: false
      }
    case SAVE_ACTIVITY:
      return {
        ...state,
        loading: true
      }
    case ACTIVITY_SAVED:
      return {
        ...state,
        loading: false,
        running: action.payload.end === undefined ? action.payload : state.running,
        activitiesByWeek: activitiesByWeekReducer(
          action.payload,
          (dayActivities, activity) => ([activity, ...dayActivities])
        )
      }
    case DELETE_ACTIVITY:
      return {
        ...state,
        loading: true
      }
    case ACTIVITY_DELETED:
      return {
        ...state,
        loading: false,
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
    case LOAD_OVERTIME:
      return {
        ...state,
        loading: true
      }
    case OVERTIME_LOADED:
      return {
        ...state,
        loading: false,
        overtimes: action.payload
      }
    case LOAD_RUNNING_ACTIVITY:
      return {
        ...state,
        loading: true
      }
    case RUNNING_ACTIVITY_LOADED:
      return {
        ...state,
        running: action.payload
      }
    case OPEN_MENU_DRAWER:
      return {
        ...state,
        menuDrawerOpen: true
      }
    case CLOSE_MENU_DRAWER:
      return {
        ...state,
        menuDrawerOpen: false
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
    default:
      return state
  }
}
