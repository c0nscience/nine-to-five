import React from 'react'
import {Router, Switch} from 'react-router-dom'
import withRoot from 'component/withRoot'
import Activity from 'activity'
import NavBar from 'NavBar'
import {AuthProvider} from 'contexts/AuthenticationContext'
import {AUTH_CONFIG} from 'contexts/AuthenticationContext/auth0-config'
import PrivateRoute from 'component/PrivateRoute'
import {NetworkActivityProvider} from 'contexts/NetworkContext'
import LoadingIndicator from 'component/LoadingIndicator'
import {ActivityProvider} from 'contexts/ActivityContext'
import {StatisticProvider} from 'contexts/StatisticContext'
import {BulkModeProvider} from 'contexts/BulkModeContext'
import StatisticConfiguration from 'statistic/configuration'
import {TitleProvider} from 'contexts/TitleContext'
import MetricList from 'Metrics/List'
import MetricCreatePage from 'Metrics/CreatePage'
import MetricDetailPage from 'Metrics/Detail'
import MetricEditPage from 'Metrics/Edit'
import {MetricsProvider} from 'contexts/MetricsContext'
import Navigation from 'Navigation'

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

            {/*<NavBar/>*/}
            {/*<LoadingIndicator/>*/}

            <Switch>
              <PrivateRoute path="/statistic/configuration" component={() =>
                <StatisticProvider>
                  <ActivityProvider>
                    <StatisticConfiguration/>
                  </ActivityProvider>
                </StatisticProvider>
              }/>

              <PrivateRoute exact path="/metrics/new" component={() =>
                <MetricsProvider>
                  <ActivityProvider>
                    <MetricCreatePage/>
                  </ActivityProvider>
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
                </MetricsProvider>
              }/>

              <PrivateRoute exact path="/" component={() =>
                <StatisticProvider>
                  <ActivityProvider>
                    <Activity/>
                  </ActivityProvider>
                </StatisticProvider>
              }/>

            </Switch>

            <Navigation/>

          </TitleProvider>
        </BulkModeProvider>
      </NetworkActivityProvider>
    </Router>
  </AuthProvider>

}

export default withRoot(App)
