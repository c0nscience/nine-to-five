import React from 'react'
import { ListItem, ListItemText } from 'material-ui/List'
import moment from 'moment'

const ActivityItem = (props) => {
  const { name, start, end, isRunning } = props
  const duration = `${moment(start).format('HH:mm')} - ${end === undefined ? '' : moment(end).format('HH:mm')}`
  return (
    <ListItem className={isRunning ? 'running' : ''}>
      <ListItemText primary={name} secondary={duration}/>
    </ListItem>
  )
}

export default ActivityItem
