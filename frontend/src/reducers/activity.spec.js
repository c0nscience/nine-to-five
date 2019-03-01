import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import fetchMock from 'fetch-mock'
import {loadActivities} from './activity'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

xdescribe('async activity actions', () => {

  afterEach(() => {
    fetchMock.reset()
    fetchMock.restore()
  })

  it('should load activities', () => {
    fetchMock.getOnce('/activities', {
      body: [{ id: 1, name: 'first' }],
      headers: { 'content-type': 'application/json' }
    })

    const expectedActions = [
      { type: 'API_REQUEST' },
      { type: 'ACTIVITIES_LOADED', authenticated: true, response: [{ id: 1, name: 'first' }]}
    ]

    const store = mockStore({activities: []})

    return store.dispatch(loadActivities()).then(() => {
      expect(store.getActions()).toEqual(expectedActions)
    })

  })
})
