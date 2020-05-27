import React from 'react'
import {Router, Switch} from 'react-router-dom'
import withRoot from 'component/withRoot'
import Activity from 'activity'
import {AuthProvider} from 'contexts/AuthenticationContext'
import {AUTH_CONFIG} from 'contexts/AuthenticationContext/auth0-config'
import PrivateRoute from 'component/PrivateRoute'
import {NetworkActivityProvider} from 'contexts/NetworkContext'
import {ActivityProvider} from 'contexts/ActivityContext'
import {BulkModeProvider} from 'contexts/BulkModeContext'
import {TitleProvider} from 'contexts/TitleContext'
import MetricList from 'Metrics/List'
import MetricCreatePage from 'Metrics/CreatePage'
import MetricDetailPage from 'Metrics/Detail'
import MetricEditPage from 'Metrics/Edit'
import {MetricsProvider} from 'contexts/MetricsContext'
import Navigation from 'Navigation'
import ActivityDetail from 'activity/Detail'
import ActivityEdit from 'activity/Edit'

const App = ({history}) => {
  return <AuthProvider domain={AUTH_CONFIG.domain}
                       client_id={AUTH_CONFIG.clientId}
                       redirect_uri={AUTH_CONFIG.callbackUrl}
                       audience={'https://api.ntf.io'}
                       scope={'openid read:activities start:activity stop:activity update:activity delete:activity read:overtime read:logs create:log update:log read:metrics create:metrics delete:metrics update:metric'}>
    <Router history={history}>
      <NetworkActivityProvider>
        <BulkModeProvider>
          <TitleProvider>
            <ActivityProvider>

              <Switch>
                <PrivateRoute exact path="/metrics/new" component={() =>
                  <MetricsProvider>
                    <MetricCreatePage/>
                  </MetricsProvider>
                }/>

                <PrivateRoute exact path="/metrics/:id" component={() =>
                  <MetricsProvider>
                    <MetricDetailPage/>
                  </MetricsProvider>
                }/>

                <PrivateRoute exact path="/metrics/:id/edit" component={() =>
                  <MetricsProvider>
                    <MetricEditPage/>
                  </MetricsProvider>
                }/>

                <PrivateRoute exact path="/metrics" component={() =>
                  <MetricsProvider>
                    <MetricList/>
                    <Navigation/>
                  </MetricsProvider>
                }/>

                <PrivateRoute exact path="/activities/:id/edit" component={() =>
                  <ActivityEdit/>
                }/>

                <PrivateRoute exact path="/activities/:id" component={() =>
                  <ActivityDetail/>
                }/>

                <PrivateRoute exact path="/" component={() =>
                  <>
                    <Activity/>
                    <Navigation/>
                  </>
                }/>

              </Switch>

            </ActivityProvider>
          </TitleProvider>
        </BulkModeProvider>
      </NetworkActivityProvider>
    </Router>
  </AuthProvider>

}

export default withRoot(App)
