import React from 'react'
import { connect } from 'react-redux'
import { ListItem, ListItemSecondaryAction, ListItemText } from 'material-ui/List'
import IconButton from 'material-ui/IconButton'
import moment from 'moment'
import { withStyles } from 'material-ui/styles'
import green from 'material-ui/colors/green'
import amber from 'material-ui/colors/amber'
import Edit from 'material-ui-icons/Edit'
import { selectActivity } from '../reducers/activity'

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
  const { id, name, start: startUtc, end: endUtc } = props

  const localStart = moment.utc(startUtc).local()
  const localEnd = moment.utc(endUtc).local()

  const duration = moment.duration(moment(localEnd).diff(moment(localStart))).humanize()
  const period = `${duration} from ${localStart.format(timeFormat)} ${endUtc === undefined ? '' : `to ${localEnd.format(timeFormat)}`}`

  return (
    <ListItem>
      <ListItemText primary={name} secondary={period}/>
      <ListItemSecondaryAction>
        <IconButton aria-label="Edit"
                    onClick={() => {
                      props.selectActivity({
                        id,
                        name,
                        start: localStart,
                        end: endUtc && localEnd
                      })
                    }}>
          <Edit/>
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  )
}

const mapStateToProps = state => ({})
const mapDispatchToProps = {
  selectActivity
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withStyles(styles)(ActivityItem))
