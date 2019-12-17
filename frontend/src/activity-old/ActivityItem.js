import React, { useState } from 'react'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles'
import Edit from '@material-ui/icons/Edit'
import Replay from '@material-ui/icons/Replay'
import More from '@material-ui/icons/MoreVert'
import Shuffle from '@material-ui/icons/Shuffle'
import { continueActivity, selectActivity, switchActivity } from '../actions'
import { amber, green } from '@material-ui/core/colors'
import IconButton from '@material-ui/core/IconButton'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'
import ListItem from '@material-ui/core/ListItem/ListItem'
import { DateTime } from 'luxon'
import moment from 'moment'
import MenuItem from '@material-ui/core/MenuItem'
import Menu from '@material-ui/core/Menu'
import ListItemIcon from '@material-ui/core/ListItemIcon'

const styles = theme => ({
  done: {
    color: green[500]
  },
  running: {
    color: amber[500]
  }
})

const handleMoment = date => {
  if (moment.isMoment(date)) {
    return date.toISOString()
  } else {
    return date
  }
}

const ActivityItem = (props) => {
  const [anchorEl, setAnchorEl] = useState(undefined)

  const timeFormat = 'HH:mm'
  const {id, name, start: _start, end: _end, isRunningActivity} = props

  const end = _end && DateTime.fromISO(handleMoment(_end), {zone: 'utc'}).toLocal()
  const start = DateTime.fromISO(handleMoment(_start), {zone: 'utc'}).toLocal()
  const isInTheFuture = DateTime.local() < start
  const endOrNow = end || DateTime.local()
  const duration = endOrNow.diff(start).as('hours')
  const period = `${duration.toFixed(1)} hrs from ${start.toFormat(timeFormat)} ${end === undefined ? '' : `to ${end.toFormat(timeFormat)}`}`

  return <ListItem disabled={isInTheFuture}>
    <ListItemText primary={name} secondary={period}/>
    <ListItemSecondaryAction>
      <IconButton aria-label="Menu"
                  aria-haspopup="true"
                  onClick={(event) => {
                    setAnchorEl(event.currentTarget)
                  }}>
        <More/>
      </IconButton>
      <Menu
        id={`item-menu-${id}`}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(undefined)}>
        {!isRunningActivity && <MenuItem onClick={() => {
          setAnchorEl(undefined)
          window.scroll(0, 0)
          props.continueActivity(name)
        }}>
          <ListItemIcon>
            <Replay/>
          </ListItemIcon>
          <ListItemText primary='Replay'/>
        </MenuItem>}
        {isRunningActivity && <MenuItem onClick={() => {
          setAnchorEl(undefined)
          window.scroll(0, 0)
          props.switchActivity(name)
        }}>
          <ListItemIcon>
            <Shuffle/>
          </ListItemIcon>
          <ListItemText primary='Switch'/>
        </MenuItem>}
        <MenuItem onClick={() => {
          setAnchorEl(undefined)
          window.scroll(0, 0)
          props.selectActivity({
            id,
            name,
            start: start.toISO(),
            end: end.toISO()
          })
        }}>
          <ListItemIcon>
            <Edit/>
          </ListItemIcon>
          <ListItemText primary='Edit'/>
        </MenuItem>
      </Menu>
    </ListItemSecondaryAction>
  </ListItem>
}

const mapStateToProps = state => ({
  isRunningActivity: state.activity.running !== undefined
})

const mapDispatchToProps = {
  selectActivity,
  continueActivity,
  switchActivity
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withStyles(styles)(ActivityItem))
