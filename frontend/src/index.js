import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import registerServiceWorker from './registerServiceWorker'
import { Provider } from 'react-redux'
import store, { history } from './store'
import { logout } from './reducers/auth'

const state = store.getState()
if (state.auth && !state.auth.isAuthenticated) {
  store.dispatch(logout())
}

ReactDOM.render(
  <Provider store={store}>
    <App history={history}/>
  </Provider>,
  document.getElementById('root')
)
registerServiceWorker()
