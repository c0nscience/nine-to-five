import React from 'react'
import { Route, Switch } from 'react-router'
import Activity from './activity/Activity'

const routes = (
  <Switch>
    <Route exact path="/" component={Activity}/>
  </Switch>
)

export default routes
