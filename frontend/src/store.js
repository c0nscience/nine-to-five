import {createBrowserHistory} from 'history'
// import auth from './reducers/auth'
// import { connectRouter, routerMiddleware } from 'connected-react-router'

export const history = createBrowserHistory()

// const reducers = history => combineReducers({
//   router: connectRouter(history),
//   activity,
//   // auth,
//   error,
//   network
// })
//
// const epicMiddleware = createEpicMiddleware()
// const store = createStore(
//   reducers(history),
//   composeWithDevTools(
//     applyMiddleware(
//       epicMiddleware,
//       thunkMiddleware,
//       routerMiddleware(history)
//     )
//   )
// )
//
// epicMiddleware.run(rootEpic)
//
// export default store
