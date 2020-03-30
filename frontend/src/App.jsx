import React from 'react'
import {Router, Switch} from 'react-router-dom'
import withRoot from './component/withRoot'
import Activity from './activity'
import NavBar from './NavBar'
import {AuthProvider} from 'contexts/AuthenticationContext'
import {AUTH_CONFIG} from 'contexts/AuthenticationContext/auth0-config'
import PrivateRoute from 'component/PrivateRoute'
import {NetworkActivityProvider} from 'contexts/NetworkContext'
import LoadingIndicator from 'component/LoadingIndicator'
import {ActivityProvider} from 'contexts/ActivityContext'
import {StatisticProvider} from 'contexts/StatisticContext'
import {InfiniteScrollingProvider} from 'contexts/IntiniteScrolling'

const App = ({history}) => {
  return <AuthProvider domain={AUTH_CONFIG.domain}
                       client_id={AUTH_CONFIG.clientId}
                       redirect_uri={AUTH_CONFIG.callbackUrl}
                       audience={'https://api.ntf.io'}
                       scope={'openid read:activities start:activity stop:activity update:activity delete:activity read:overtime read:logs create:log update:log'}>
    <NetworkActivityProvider>
      <NavBar/>
      <LoadingIndicator/>

      <Router history={history}>
        <Switch>
          <PrivateRoute exact path="/" component={() => <StatisticProvider>
            <ActivityProvider>
              <InfiniteScrollingProvider>
                <Activity/>
              </InfiniteScrollingProvider>
            </ActivityProvider>
          </StatisticProvider>}/>
        </Switch>
      </Router>
    </NetworkActivityProvider>
  </AuthProvider>

}

export default withRoot(App)
