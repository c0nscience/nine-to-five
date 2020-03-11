import React from 'react'
import {Router, Switch} from 'react-router-dom'
import withRoot from './component/withRoot'
import Activity from './activity'
import NavBar from './NavBar'
import {AuthProvider} from 'contexts/AuthenticationContext'
import {AUTH_CONFIG} from 'contexts/AuthenticationContext/auth0-config'
import PrivateRoute from 'component/PrivateRoute'

const App = ({history}) => {
  return <AuthProvider domain={AUTH_CONFIG.domain}
                       client_id={AUTH_CONFIG.clientId}
                       redirect_uri={AUTH_CONFIG.callbackUrl}
                       audience={'https://api.ntf.io'}
                       scope={'openid read:activities start:activity stop:activity update:activity delete:activity read:overtime read:logs create:log update:log'}
  >
    <NavBar/>
    {/*<LoadingIndicator/>*/}
    <Router history={history}>
      <Switch>
        <PrivateRoute exact path="/" component={Activity}/>
      </Switch>
    </Router>
  </AuthProvider>

}

export default withRoot(App)
