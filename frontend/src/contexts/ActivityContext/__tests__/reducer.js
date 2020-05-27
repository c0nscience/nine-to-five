import {initialState, reducer} from '../reducer'
import {activitiesInRangeLoaded, activityLoaded} from 'contexts/ActivityContext/actions'
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
})
