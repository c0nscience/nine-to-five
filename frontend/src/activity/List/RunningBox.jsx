import React, {useEffect, useState} from 'react'
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

const updateInterval = 30000
let timeUpdater

export default ({activity}) => {
  const [end, setEnd] = useState(DateTime.local())
  const start = DateTime.fromISO(activity.start, {zone: 'utc'}).toLocal()
  const duration = end.diff(start)

  useEffect(() => {
    timeUpdater = setInterval(() =>
      setEnd(DateTime.local())
    , updateInterval)

    return () => {
      if (timeUpdater) {
        clearInterval(timeUpdater)
      }
    }
  })

  return <RunningBox name={activity.name}
                     tags={activity.tags}
                     duration={duration}
                     since={start.toFormat('HH:mm')}/>
}
