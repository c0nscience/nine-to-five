import {initialState, reducer} from '../reducer'
import {
  activitiesInRangeLoaded, activityDeleted,
  activityLoaded,
  activityStarted,
  activityStopped, runningActivityLoaded
} from 'contexts/ActivityContext/actions'
import {DateTime} from 'luxon'

describe('Activity Context Reducer', () => {
  it('should add newly loaded activities to state', () => {
    const now = DateTime.local()
    const action = activitiesInRangeLoaded({entries: [
        {
          name: 'task #1',
          start: now.toISO(),
          end: now.plus({hours: 1}).toISO()
        }
      ]})
    const newState = reducer(initialState, action)

    expect(newState.activities.length).toBe(1)
    expect(newState.activities[0]).toEqual({
      name: 'task #1',
      start: now.toISO(),
      end: now.plus({hours: 1}).toISO()
    })
  })

  it('should add loaded activity to state', () => {
    const now = DateTime.local()
    const activity = {
      id: 'activity-id',
      name: 'task #1',
      start: now.toISO(),
      end: now.plus({hours: 1}).toISO(),
      tags: ['a-tag']
    }
    const action = activityLoaded(activity)

    const newState = reducer(initialState, action)

    expect(newState.activity).toEqual({
      id: 'activity-id',
      name: 'task #1',
      start: now.toISO(),
      end: now.plus({hours: 1}).toISO(),
      tags: ['a-tag']
    })
  })

  it('should stop the currently running activity and remove it from the state', function () {
    const now = DateTime.local()
    const activity = {
      id: 'activity-id',
      name: 'task #1',
      start: now.toISO(),
      end: now.plus({hours: 1}).toISO(),
      tags: ['a-tag']
    }

    const currentState = reducer(initialState, runningActivityLoaded({
        id: 'activity-id',
        name: 'task #1',
        start: now.toISO(),
        tags: ['a-tag']
      }
    ))

    const action = activityStopped(activity)

    const newState = reducer(currentState, action);

    expect(newState.running).toBeUndefined()
  })

  it('should remove the deleted running activity from running', function () {
    const now = DateTime.local()
    const activity = {
      id: 'activity-id',
      name: 'task #1',
      start: now.toISO(),
      tags: ['a-tag']
    }
    const currentState = reducer(initialState, runningActivityLoaded(activity))

    const action = activityDeleted(activity)

    const newState = reducer(currentState, action);

    expect(newState.running).toBeUndefined()
  })

  it('should remove the deleted activity from activities', function () {
    const now = DateTime.local()
    const activity = {
      id: 'activity-id',
      name: 'task #1',
      start: now.toISO(),
      tags: ['a-tag']
    }
    const currentState = reducer(initialState, activitiesInRangeLoaded({entries: [activity]}))

    const action = activityDeleted(activity)

    const newState = reducer(currentState, action);

    expect(newState.activities).toEqual([])
  })
})
