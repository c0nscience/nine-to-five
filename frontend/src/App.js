import React from 'react'
import {ConnectedRouter} from 'connected-react-router'
import {Route, Switch} from 'react-router'
import {connect} from 'react-redux'
import withRoot from './component/withRoot'
import {handleAuthentication} from './reducers/auth'
import {closeMenuDrawer} from './actions'
import NavBar from './NavBar/NavBar'
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
      <NavBar/>
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
      <div>
        <div>Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a
          href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a
          href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank"
          rel="noopener noreferrer">CC 3.0 BY</a></div>
      </div>
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
