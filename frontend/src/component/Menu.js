import React from 'react'
import { withStyles } from 'material-ui/styles'
import Drawer from 'material-ui/Drawer'
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'
import ListSubheader from 'material-ui/List/ListSubheader'
import { closeMenuDrawer, loadLogs } from '../actions'
import { connect } from 'react-redux'
import RefreshIcon from '@material-ui/icons/Refresh'
import { push, replace } from 'connected-react-router'
import { IconButton, ListItemSecondaryAction } from 'material-ui'
import Edit from '@material-ui/icons/Edit'

const styles = {
  list: {
    width: 250,
  }
}

class Menu extends React.Component {
  componentDidMount() {
    const { isAuthenticated, loadLogs } = this.props
    if (isAuthenticated) {
      loadLogs()
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isAuthenticated === false && this.props.isAuthenticated) {
      this.props.loadLogs()
    }
  }

  render() {
    const { menuDrawerOpen: open, closeMenuDrawer, classes, logs, push, replace } = this.props
    return <Drawer open={open} onClose={closeMenuDrawer}>
      <div
        tabIndex={0}
        role="button"
        onClick={closeMenuDrawer}
        onKeyDown={closeMenuDrawer}>
        <List className={classes.list}>
          <ListItem button onClick={() => {
            window.location.reload()
          }}>
            <ListItemIcon>
              <RefreshIcon/>
            </ListItemIcon>
          </ListItem>

          {/*TODO only show while logged int*/}
          <ListItem button>
            <ListItemText primary="Today"/>
          </ListItem>
          <ListItem button>
            <ListItemText primary="This Week"/>
          </ListItem>

          {/*Only show while logged in*/}
          <ListSubheader>Lists</ListSubheader>
          {logs.map(log =>
            <ListItem button key={log.id} onClick={() => {
              replace(`/log/${log.id}`)
            }}>
              <ListItemText primary={log.name}/>
              <ListItemSecondaryAction>
                <IconButton aria-label={`Edit '${log.name}' log`} onClick={() => {
                  push(`/log/${log.id}/edit`)
                }}>
                  <Edit/>
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          )}
          <ListItem button onClick={() => {
            replace('/')
          }}>
            <ListItemText primary="Default"/>
          </ListItem>
          <ListItem button onClick={() => {
            push('/log/new')
          }}>
            <ListItemText primary="Add"/>
          </ListItem>
        </List>
      </div>
    </Drawer>
  }
}

const mapStateToProps = state => ({
  menuDrawerOpen: state.activity.menuDrawerOpen,
  isAuthenticated: state.auth.isAuthenticated,
  logs: state.activity.logs
})

const mapDispatchToProps = {
  closeMenuDrawer,
  loadLogs,
  push,
  replace,
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Menu))
