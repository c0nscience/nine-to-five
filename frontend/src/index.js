import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './AppV2'
import * as serviceWorker from './serviceWorker'
import {history} from './store'

ReactDOM.render(
  // <Provider store={store}>
  <App history={history}/>,
  // </Provider>,
  document.getElementById('root')
)
serviceWorker.unregister()
