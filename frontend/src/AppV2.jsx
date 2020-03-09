import React from 'react'
import {Route, Router, Switch} from 'react-router'
import withRoot from './component/withRoot'
import Activity from './activity'
import LoadingIndicator from './component/LoadingIndicator'
import BottomBar from './NavBar/BottomBar'

const App = ({history}) => {
  return (
    <>
      <LoadingIndicator/>
      <Router history={history}>
        <Switch>
          <Route exact path="/" component={Activity}/>
        </Switch>
      </Router>
      <BottomBar/>
    </>
  )
}

export default withRoot(App)
