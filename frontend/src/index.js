import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './AppV2'
import * as serviceWorker from './serviceWorker'
import {createBrowserHistory} from 'history'

const history = createBrowserHistory()

ReactDOM.render(
  <App history={history}/>,
  document.getElementById('root')
)
serviceWorker.unregister()
