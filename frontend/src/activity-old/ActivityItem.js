import React from 'react'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles'
import Edit from '@material-ui/icons/Edit'
import { selectActivity } from '../actions'
import { amber, green } from '@material-ui/core/colors'
import IconButton from '@material-ui/core/IconButton'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'
import ListItem from '@material-ui/core/ListItem/ListItem'
import { DateTime } from 'luxon'
import moment from 'moment'

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
    console.log('isMoment')
    return date.toISOString()
  } else {
    console.log('is not moment')
    return date
  }
}

const ActivityItem = (props) => {
  const timeFormat = 'HH:mm'
  const {id, name, start: _start, end: _end} = props

  const end = _end && DateTime.fromISO(handleMoment(_end)).toLocal()
  const start = DateTime.fromISO(handleMoment(_start)).toLocal()
  const endOrNow = end || DateTime.local()
  const duration = endOrNow.diff(start).as('hours')
  const period = `${duration.toFixed(1)} hrs from ${start.toFormat(timeFormat)} ${end === undefined ? '' : `to ${end.toFormat(timeFormat)}`}`

  return (
    <ListItem>
      <ListItemText primary={name} secondary={period}/>
      <ListItemSecondaryAction>
        <IconButton aria-label="Edit"
                    onClick={() => {
                      props.selectActivity({
                        id,
                        name,
                        start: start,
                        end: end
                      })
                    }}>
          <Edit/>
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  )
}

const mapDispatchToProps = {
  selectActivity
}

export default connect(
  null,
  mapDispatchToProps,
)(withStyles(styles)(ActivityItem))
