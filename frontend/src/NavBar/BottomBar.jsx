import React from 'react'
import {withStyles} from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import AddIcon from '@material-ui/icons/Add'
import {login, logout} from '../reducers/auth'
import {openMenuDrawer} from '../actions'
import Fab from '@material-ui/core/Fab'

const styles = {
  root: {
    width: '100%'
  },
  flex: {
    flex: 1
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 20
  },
  appBar: {
    top: 'auto',
    bottom: 0
  },
  fabButton: {
    position: 'absolute',
    zIndex: 1,
    top: -30,
    left: 0,
    right: 0,
    margin: '0 auto'
  }
}

const NavBar = ({
                  login,
                  logout,
                  openMenuDrawer,
                  isAuthenticated,
                  classes
                }) => (
  <div className={classes.root}>
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar disableGutters>
        <IconButton className={classes.menuButton}
                    edge="start"
                    color="inherit"
                    aria-label="Menu"
                    onClick={() => {
                      openMenuDrawer()
                    }}>
          <MenuIcon/>
        </IconButton>
        <Fab color="secondary" aria-label="add" className={classes.fabButton}>
          <AddIcon/>
        </Fab>
        {/*{*/}
        {/*  !isAuthenticated && <Button color="inherit" onClick={login}>Login</Button>*/}
        {/*}*/}
        {/*{*/}
        {/*  isAuthenticated && <Button color="inherit" onClick={logout}>Logout</Button>*/}
        {/*}*/}
      </Toolbar>
    </AppBar>
  </div>
)


const mapDispatchToProps = {
  login,
  logout,
  openMenuDrawer
}

export default withStyles(styles)(NavBar)
