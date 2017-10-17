import React from 'react'
import { withStyles } from 'material-ui/styles'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import Typography from 'material-ui/Typography'
import Button from 'material-ui/Button'
import IconButton from 'material-ui/IconButton'
import MenuIcon from 'material-ui-icons/Menu'
import { connect } from 'react-redux'
import { login, logout } from '../reducers/auth'

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
                  isAuthenticated,
                  classes
                }) => (
  <div className={classes.root}>
    <AppBar position="static">
      <Toolbar disableGutters>
        <IconButton className={classes.menuButton} color="contrast" aria-label="Menu">
          <MenuIcon/>
        </IconButton>
        <Typography type="title" color="inherit" className={classes.flex}>
          Nine <span role="img" aria-label="two">✌️</span> Five
        </Typography>
        {
          !isAuthenticated && <Button color="contrast" onClick={login}>Login</Button>
        }
        {
          isAuthenticated && <Button color="contrast" onClick={logout}>Logout</Button>
        }
      </Toolbar>
    </AppBar>
  </div>
)


const mapDispatchToProps = {
  login,
  logout
}

export default connect(
  state => ({
    isAuthenticated: state.auth.isAuthenticated
  }),
  mapDispatchToProps
)(withStyles(styles)(NavBar))
