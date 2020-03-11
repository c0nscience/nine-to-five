import React from 'react'
import {Route, Router, Switch} from 'react-router'
import withRoot from './component/withRoot'
import Activity from './activity'
import NavBar from './NavBar'

const App = ({history}) => {
  return <>
    <NavBar/>
    {/*<LoadingIndicator/>*/}
    <Router history={history}>
      <Switch>
        <Route exact path="/" component={Activity}/>
      </Switch>
    </Router>
  </>

}

export default withRoot(App)
