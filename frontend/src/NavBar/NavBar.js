import React from 'react'
import {withStyles} from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import {connect} from 'react-redux'
import {login, logout} from '../reducers/auth'
import {openMenuDrawer} from '../actions'

const styles = {
  root: {
    width: '100%',
  },
  flex: {
    flex: 1,
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 20,
  },
}

const NavBar = ({
                  login,
                  logout,
                  openMenuDrawer,
                  isAuthenticated,
                  classes
                }) => (
  <div className={classes.root}>
    <AppBar position="static">
      <Toolbar disableGutters>
        <IconButton className={classes.menuButton}
                    color="inherit"
                    aria-label="Menu"
                    onClick={() => {
                      openMenuDrawer()
                    }}>
          <MenuIcon/>
        </IconButton>
        <Typography variant="h6" color="inherit" className={classes.flex}>
          Nine 2 Five
        </Typography>
        {
          !isAuthenticated && <Button color="inherit" onClick={login}>Login</Button>
        }
        {
          isAuthenticated && <Button color="inherit" onClick={logout}>Logout</Button>
        }
      </Toolbar>
    </AppBar>
  </div>
)


const mapDispatchToProps = {
  login,
  logout,
  openMenuDrawer
}

export default connect(
  state => ({
    isAuthenticated: state.auth.isAuthenticated
  }),
  mapDispatchToProps
)(withStyles(styles)(NavBar))
