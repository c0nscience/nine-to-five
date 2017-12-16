import React from 'react'
import { ConnectedRouter } from 'connected-react-router'
import { Route, Switch } from 'react-router'
import { connect } from 'react-redux'
import withRoot from './component/withRoot'
import { handleAuthentication } from './reducers/auth'
import NavBar from './NavBar/NavBar'
import Callback from './Callback/Callback'
import Activity from './activity/Activity'
import LoadingIndicator from './component/LoadingIndicator'

const App = ({ history, handleAuthentication }) => {
  const handleCallback = (nextState) => {
    if (/access_token|id_token|error/.test(nextState.location.hash)) {
      handleAuthentication()
    }
  }

  return (
    <div>
      <NavBar/>
      <LoadingIndicator/>
      <ConnectedRouter history={history}>
        <Switch>
          <Route exact path="/" component={Activity}/>
          <Route path="/callback" render={(props) => {
            return <Callback {...props} handleCallback={handleCallback}/>
          }}/>
        </Switch>
      </ConnectedRouter>
      <div>
        <div>Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a
          href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a
          href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank"
          rel="noopener noreferrer">CC 3.0 BY</a></div>
      </div>
    </div>
  )
}

const mapDispatchToProps = {
  handleAuthentication
}

export default connect(null, mapDispatchToProps)(withRoot(App))
