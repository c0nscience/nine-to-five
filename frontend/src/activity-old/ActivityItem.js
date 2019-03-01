import React from 'react'
import {connect} from 'react-redux'
import moment from 'moment'
import {withStyles} from '@material-ui/core/styles'
import Edit from '@material-ui/icons/Edit'
import {selectActivity} from '../actions'
import {amber, green} from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import ListItem from "@material-ui/core/ListItem/ListItem";

const styles = theme => ({
  done: {
    color: green[500]
  },
  running: {
    color: amber[500]
  }
})

const ActivityItem = (props) => {
  const timeFormat = 'HH:mm'
  const {id, name, start: _start, end: _end} = props

  const end = _end && moment.utc(_end).local()
  const start = moment.utc(_start).local()
  const endOrNow = end || moment()
  const duration = moment.duration(endOrNow.diff(start)).humanize()
  const period = `${duration} from ${start.format(timeFormat)} ${end === undefined ? '' : `to ${end.format(timeFormat)}`}`

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
