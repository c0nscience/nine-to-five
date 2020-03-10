import React from 'react'
import {ConnectedRouter} from 'connected-react-router'
import {Route, Switch} from 'react-router'
import {connect} from 'react-redux'
import withRoot from './component/withRoot'
import {handleAuthentication} from './reducers/auth'
import {closeMenuDrawer} from './actions'
import Index from './NavBar'
import Callback from './Callback/Callback'
import Activity from './activity-old/Activity'
import NewLogForm from './logs/NewLogForm'
import LoadingIndicator from './component/LoadingIndicator'
import Menu from './component/Menu'
import Log from './logs/Log'
import EditLogForm from './logs/EditLogForm'

const App = ({history, handleAuthentication, menuDrawerOpen, closeMenuDrawer}) => {
  const handleCallback = (nextState) => {
    if (/access_token|id_token|error/.test(nextState.location.hash)) {
      handleAuthentication()
    }
  }

  return (
    <div>
      <Index/>
      <Menu open={menuDrawerOpen} onClose={closeMenuDrawer}/>
      <LoadingIndicator/>
      <ConnectedRouter history={history}>
        <Switch>
          <Route exact path="/" component={Activity}/>
          <Route exact path="/log/new" component={NewLogForm}/>
          <Route exact path="/log/:id/edit" component={EditLogForm}/>
          <Route exact path="/log/:id" component={Log}/>
          <Route path="/callback" render={(props) => {
            return <Callback {...props} handleCallback={handleCallback}/>
          }}/>
        </Switch>
      </ConnectedRouter>
    </div>
  )
}

const mapStateToProps = state => ({
  menuDrawerOpen: state.activity.menuDrawerOpen
})

const mapDispatchToProps = {
  handleAuthentication,
  closeMenuDrawer
}

export default connect(mapStateToProps, mapDispatchToProps)(withRoot(App))
