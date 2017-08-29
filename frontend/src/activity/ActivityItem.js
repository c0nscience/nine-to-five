import React from 'react'
import { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'
import moment from 'moment'
import Done from 'material-ui-icons/Done'
import Update from 'material-ui-icons/Update'

const ActivityItem = (props) => {
  const timeFormat = 'HH:mm'
  const { name, start: startUtc, end: endUtc, isRunning } = props

  const localStart = moment.utc(startUtc).local()
  const localEnd = moment.utc(endUtc).local()

  const duration = moment.duration(moment(localEnd).diff(moment(localStart))).humanize()
  const period = `${duration} from ${localStart.format(timeFormat)} ${endUtc === undefined ? '' : `to ${localEnd.format(timeFormat)}`}`
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
