import React from 'react'
import './App.css'
import withRoot from './component/withRoot'
import NavBar from './NavBar/NavBar'
import { ConnectedRouter } from 'connected-react-router'
import routes from './routes'

const App = ({ history }) => {
  return (
    <div>
      <ConnectedRouter history={history}>
        <div>
          <NavBar/>
          {routes}
        </div>
      </ConnectedRouter>
    </div>
  )
}

export default withRoot(App)
