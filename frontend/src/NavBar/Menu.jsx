import React from 'react'
import {makeStyles} from '@material-ui/core/styles'
import RefreshIcon from '@material-ui/icons/Refresh'
import Drawer from '@material-ui/core/Drawer'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import AccountCircleIcon from '@material-ui/icons/AccountCircle'
import TagIcon from '@material-ui/icons/LocalOffer'
import SettingsIcon from '@material-ui/icons/Settings'
import {ListItemText} from '@material-ui/core'
import {useAuth} from 'contexts/AuthenticationContext'

const useStyles = makeStyles({
  list: {
    width: 180
  }
})

const Menu = ({open, closeDrawer}) => {
  const classes = useStyles()
  const {isAuthenticated, loginWithRedirect, logout} = useAuth()

  return <Drawer open={open} onClose={closeDrawer} anchor="right">
    <div
      tabIndex={0}
      role="presentation"
      onClick={closeDrawer}
      onKeyDown={closeDrawer}>
      <List className={classes.list}>
        <ListItem button onClick={() => {
          window.location.reload()
        }}>
          <ListItemIcon>
            <RefreshIcon/>
          </ListItemIcon>
          <ListItemText primary="Refresh"/>
        </ListItem>

        {/*<ListItem button>*/}
        {/*  <ListItemIcon>*/}
        {/*    <SettingsIcon/>*/}
        {/*  </ListItemIcon>*/}
        {/*  <ListItemText primary="Settings"/>*/}
        {/*</ListItem>*/}

        {/*<ListItem button>*/}
        {/*  <ListItemIcon>*/}
        {/*    <TagIcon/>*/}
        {/*  </ListItemIcon>*/}
        {/*  <ListItemText primary="Tags"/>*/}
        {/*</ListItem>*/}

        {!isAuthenticated && <ListItem button onClick={() => {
          loginWithRedirect()
        }}>
          <ListItemIcon>
            <AccountCircleIcon/>
          </ListItemIcon>
          <ListItemText primary="Login"/>
        </ListItem>}

        {isAuthenticated && <ListItem button onClick={() => {
          logout()
        }}>
          <ListItemIcon>
            <AccountCircleIcon/>
          </ListItemIcon>
          <ListItemText primary="Logout"/>
        </ListItem>}
      </List>
    </div>
  </Drawer>
}

export default Menu
