import {initialState, reducer} from '../reducer'
import {metricConfigurationLoaded} from 'contexts/MetricsContext/actions'

describe('Metrics Context Reducer', () => {
  it('should add loaded metric configurations to state', () => {
    const action = metricConfigurationLoaded([{id: "some-id", name: "overtime"}])
    const newState = reducer(initialState, action)

    expect(newState.configurations).toContainEqual({id: "some-id", name: "overtime"})
  })
})
