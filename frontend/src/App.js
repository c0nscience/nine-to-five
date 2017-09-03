import React from 'react'
import { ConnectedRouter } from 'connected-react-router'
import { Route, Switch } from 'react-router'
import { connect } from 'react-redux'
import withRoot from './component/withRoot'
import { handleAuthentication } from './reducers/auth'
import NavBar from './NavBar/NavBar'
import Callback from './Callback/Callback'
import Activity from './activity/Activity'

const App = ({ history, handleAuthentication }) => {
  const handleCallback = (nextState) => {
    if (/access_token|id_token|error/.test(nextState.location.hash)) {
      handleAuthentication()
    }
  }

  return (
    <div>
      <NavBar/>
      <ConnectedRouter history={history}>
        <Switch>
          <Route exact path="/" component={Activity}/>
          <Route path="/callback" render={(props) => {
            handleCallback(props)
            return <Callback {...props}/>
          }}/>
        </Switch>
      </ConnectedRouter>
    </div>
  )
}

const mapDispatchToProps = {
  handleAuthentication
}

export default connect(null, mapDispatchToProps)(withRoot(App))
