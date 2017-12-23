import {
  ACTIVITIES_LOADED, ACTIVITY_DELETED, ACTIVITY_SAVED, ACTIVITY_STARTED, ACTIVITY_STOPPED, DELETE_ACTIVITY,
  DESELECT_ACTIVITY, LOAD_ACTIVITIES, LOAD_OVERTIME, OVERTIME_LOADED, SAVE_ACTIVITY, SELECT_ACTIVITY, START_ACTIVITY,
  STOP_ACTIVITY
} from '../actions'
import moment from 'moment/moment'

const initialState = {
  loading: false,
  openEditDialog: false,
  openCreateDialog: false,
  selectedActivity: {},
  activitiesByWeek: {},
  activities: [],
  overtimes: []
}

const reduceActivitiesByWeek = state => (activity, reducer) => {
  const weekDate = activity.start.format('GGGG-WW')
  const dayDate = activity.start.format('ll')

  const end = activity.end || moment()
  const diff = end.diff(activity.start)

  const week = state.activitiesByWeek[weekDate] || {
    totalDuration: 0,
    days: {}
  }

  const day = week.days[dayDate] || {
    totalDuration: 0,
    activities: []
  }

  const days = {
    ...week.days,
    [dayDate]: {
      ...day,
      totalDuration: day.totalDuration + diff,
      activities: reducer(day.activities, activity)
    }
  }

  return {
    ...state.activitiesByWeek,
    [weekDate]: {
      ...week,
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
        activitiesByWeek: action.payload.activitiesByWeek,
        activities: action.payload.activities,
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
        activities: [
          action.payload,
          ...state.activities
        ],
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
        activities: state.activities.map(activity => (
          activity.id === action.payload.id ?
            action.payload :
            activity
        )),
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
        activities: state.activities.map(activity => (
          activity.id === action.payload.id ?
            action.payload :
            activity
        )),
        activitiesByWeek: activitiesByWeekReducer(
          action.payload,
          (dayActivities, activity) => dayActivities.map(a => (
            a.id === activity.id ? activity : a
          ))
        )
      }
    case DELETE_ACTIVITY:
      return {
        ...state,
        loading: true
      }
    case ACTIVITY_DELETED:
      const deletedActivityIndex = state.activities.findIndex(activity => activity.id === action.payload.id)
      const activityToDelete = state.activities[deletedActivityIndex]
      return {
        ...state,
        loading: false,
        activities: [
          ...state.activities.slice(0, deletedActivityIndex),
          ...state.activities.slice(deletedActivityIndex + 1)
        ],
        activitiesByWeek: activitiesByWeekReducer(
          activityToDelete,
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
    default:
      return state
  }
}
