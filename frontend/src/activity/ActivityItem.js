import React from 'react'
import { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'
import moment from 'moment'
import Done from 'material-ui-icons/Done'
import Update from 'material-ui-icons/Update'

const ActivityItem = (props) => {
  const { name, start, end, isRunning } = props
  const format = 'HH:mm'
  const startTime = moment(start).format(format)
  const endTime = moment(end).format(format)
  const duration = moment.duration(moment(end).diff(moment(start))).humanize()
  const period = `${duration} from ${startTime} to ${end === undefined ? '' : endTime}`
  const icon = isRunning ? <Update/> : <Done/>

  return (
    <ListItem>
      <ListItemIcon>
        {icon}
      </ListItemIcon>
      <ListItemText primary={name} secondary={period}/>
    </ListItem>
  )
}

export default ActivityItem
