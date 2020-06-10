import React from 'react'
import {ActivityItemCard} from './ActivityItem'
import {DateTime} from 'luxon'
import {amber} from '@material-ui/core/colors'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles(theme => ({
  card: {
    backgroundColor: amber[50]
  },
}))

export const RunningBox = ({name, tags, duration, since}) => {
  const classes = useStyles()
  return <ActivityItemCard name={name}
                           tags={tags}
                           duration={duration}
                           since={since}
                           cardClass={classes.card}
                           raised
                           square/>
}

export default ({activity}) => {
  const start = DateTime.fromISO(activity.start, {zone: 'utc'}).toLocal()
  const duration = DateTime.local().diff(start)

  return <RunningBox name={activity.name}
                     tags={activity.tags}
                     duration={duration}
                     since={start.toFormat('HH:mm')}/>
}
