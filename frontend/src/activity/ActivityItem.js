import React from 'react'
import { connect } from 'react-redux'
import { ListItem, ListItemSecondaryAction, ListItemText } from 'material-ui/List'
import IconButton from 'material-ui/IconButton'
import moment from 'moment'
import { withStyles } from 'material-ui/styles'
import green from 'material-ui/colors/green'
import amber from 'material-ui/colors/amber'
import Edit from 'material-ui-icons/Edit'
import { selectActivity } from '../actions'

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
  const { id, name, start, end } = props
  console.time(`item-render-${id}`)

  const endOrNow = end || moment()
  const duration = moment.duration(endOrNow.diff(start)).humanize()
  const period = `${duration} from ${start.format(timeFormat)} ${end === undefined ? '' : `to ${end.format(timeFormat)}`}`

  const content = (
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

  console.timeEnd(`item-render-${id}`)
  return content
}

const mapDispatchToProps = {
  selectActivity
}

export default connect(
  null,
  mapDispatchToProps,
)(withStyles(styles)(ActivityItem))
