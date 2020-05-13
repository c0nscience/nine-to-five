import {initialState, reducer} from '../reducer'
import {metricConfigurationLoaded, metricDetailLoaded} from 'contexts/MetricsContext/actions'

describe('Metrics Context Reducer', () => {
  it('should add loaded metric configurations to state', () => {
    const action = metricConfigurationLoaded([{id: "some-id", name: "overtime"}])
    const newState = reducer(initialState, action)

    expect(newState.metricDetail).toEqual(initialState.metricDetail)
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

    expect(newState.configurations).toEqual(initialState.configurations)
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
})
