import React from 'react'
import { withStyles } from 'material-ui/styles'
import Drawer from 'material-ui/Drawer'
import List, { ListItem, ListItemText, ListItemIcon } from 'material-ui/List'
import ListSubheader from 'material-ui/List/ListSubheader'
import { closeMenuDrawer } from '../actions'
import { connect } from 'react-redux'
import RefreshIcon from 'material-ui-icons/Refresh'

const styles = {
  list: {
    width: 250,
  }
}

const Menu = ({ menuDrawerOpen: open, closeMenuDrawer, classes }) => (
  <Drawer open={open} onRequestClose={closeMenuDrawer}>
    <div
      tabIndex={0}
      role="button"
      onClick={closeMenuDrawer}
      onKeyDown={closeMenuDrawer}>
        <List className={classes.list}>
          <ListItem button onClick={() => {window.location.reload()}}>
            <ListItemIcon>
              <RefreshIcon/>
            </ListItemIcon>
          </ListItem>
          <ListItem button>
            <ListItemText primary="Today"/>
          </ListItem>
          <ListItem button>
            <ListItemText primary="This Week"/>
          </ListItem>

          <ListSubheader>Lists</ListSubheader>
          <ListItem button>
            <ListItemText primary="Scout24"/>
          </ListItem>
          <ListItem button>
            <ListItemText primary="NIST"/>
          </ListItem>
        </List>
    </div>
  </Drawer>
)

const mapStateToProps = state => ({
  menuDrawerOpen: state.activity.menuDrawerOpen
})

const mapDispatchToProps = {
  closeMenuDrawer
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Menu))
