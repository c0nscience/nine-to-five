import {initialState, reducer} from '../reducer'
import {
  metricConfigurationLoaded,
  metricConfigurationsLoaded,
  metricDetailLoaded
} from 'contexts/MetricsContext/actions'

const expectUnchanged = fields => newState => {
  fields.forEach(field => {
    expect(newState[field]).toEqual(initialState[field])
  })
}

describe('Metrics Context Reducer', () => {
  it('should add loaded metric configurations to state', () => {
    const action = metricConfigurationsLoaded([{id: "some-id", name: "overtime"}])
    const newState = reducer(initialState, action)

    expectUnchanged(['metricDetail', 'configuration'])(newState)
    expect(newState.configurations).toContainEqual({id: "some-id", name: "overtime"})
  })

  it('should set loaded metric detail to state', () => {
    const action = metricDetailLoaded({
      id: 'uuid',
      name: 'overtime',
      totalExceedingDuration: 'PT4H30M',
      formula: 'limited-sum',
      threshold: 40.0,
      values: [{
        date: '2020-05-12',
        duration: 'PT44H30M'
      }]
    })

    const newState = reducer(initialState, action)

    expectUnchanged(['configurations', 'configuration'])(newState)
    expect(newState.metricDetail).toEqual({
      id: 'uuid',
      name: 'overtime',
      totalExceedingDuration: 'PT4H30M',
      formula: 'limited-sum',
      threshold: 40.0,
      values: [{
        date: '2020-05-12',
        duration: 'PT44H30M'
      }]
    })
  })

  it('should add loaded metric configuration to state', () => {
    const action = metricConfigurationLoaded({
      id: 'uuid',
      name: 'Overtime',
      tags: ['some-tag'],
      threshold: 40.0,
      unit: 'WEEKS',
      formula: 'sum'
    })

    const newState = reducer(initialState, action)

    expectUnchanged(['metricDetail', 'configurations'])(newState)
    expect(newState.configuration).toEqual({
      id: 'uuid',
      name: 'Overtime',
      tags: ['some-tag'],
      threshold: 40.0,
      unit: 'WEEKS',
      formula: 'sum'
    })
  })
})
