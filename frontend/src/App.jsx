import React from 'react'
import {Route, Router, Switch} from 'react-router-dom'
import withRoot from 'component/withRoot'
import Activity from 'activity'
import {Auth0Provider, withAuthenticationRequired} from '@auth0/auth0-react'
import {NetworkActivityProvider} from 'contexts/NetworkContext'
import {ActivityProvider} from 'contexts/ActivityContext'
import {TitleProvider} from 'contexts/TitleContext'
import MetricList from 'Metrics/List'
import MetricCreatePage from 'Metrics/CreatePage'
import MetricDetailPage from 'Metrics/Detail'
import MetricEditPage from 'Metrics/Edit'
import {MetricsProvider} from 'contexts/MetricsContext'
import Navigation from 'Navigation'
import ActivityDetail from 'activity/Detail'
import ActivityEdit from 'activity/Edit'
import {createBrowserHistory} from 'history'

const history = createBrowserHistory()

const ProtectedRoute = ({component, ...args}) => (
  <Route component={withAuthenticationRequired(component)} {...args} />
)

const onRedirectCallback = (appState) => {
  // Use the router's history module to replace the url
  history.replace(appState?.returnTo || window.location.pathname)
}


const App = () => {
  return <Auth0Provider domain={'ninetofive.eu.auth0.com'}
                        clientId={'geVcIIV3P9wyOusuZVY06VzLqZt6emr6'}
                        redirectUri={process.env.REACT_APP_CALLBACK_URL}
                        onRedirectCallback={onRedirectCallback}
                        audience='https://api.ntf.io'
                        scope='openid read:activities start:activity stop:activity update:activity delete:activity read:metrics create:metrics delete:metrics update:metric'
                        cacheLocation='localstorage'
                        useRefreshTokens={true}>
    <Router history={history}>
      <NetworkActivityProvider>
        <TitleProvider>
          <ActivityProvider>

            <Switch>
              <ProtectedRoute exact path="/metrics/new" component={() =>
                <MetricsProvider>
                  <MetricCreatePage/>
                </MetricsProvider>
              }/>

              <ProtectedRoute exact path="/metrics/:id" component={() =>
                <MetricsProvider>
                  <MetricDetailPage/>
                </MetricsProvider>
              }/>

              <ProtectedRoute exact path="/metrics/:id/edit" component={() =>
                <MetricsProvider>
                  <MetricEditPage/>
                </MetricsProvider>
              }/>

              <ProtectedRoute exact path="/metrics" component={() =>
                <MetricsProvider>
                  <MetricList/>
                  <Navigation/>
                </MetricsProvider>
              }/>

              <ProtectedRoute exact path="/activities/:id/edit" component={() =>
                <ActivityEdit/>
              }/>

              <ProtectedRoute exact path="/activities/:id" component={() =>
                <ActivityDetail/>
              }/>

              <ProtectedRoute exact path="/" component={() =>
                <>
                  <Activity/>
                  <Navigation/>
                </>
              }/>

            </Switch>

          </ActivityProvider>
        </TitleProvider>
      </NetworkActivityProvider>
    </Router>
  </Auth0Provider>

}

export default withRoot(App)
