import React, {useEffect, useState} from 'react'
import {useActivity} from 'contexts/ActivityContext'
import {DateTime} from 'luxon'
import DayPicker from 'activity/List/DayPicker'
import ActivityItem from 'activity/List/ActivityItem'
import MuiList from '@material-ui/core/List'
import makeStyles from '@material-ui/core/styles/makeStyles'
import Fab from '@material-ui/core/Fab'
import {Add} from '@material-ui/icons'
import StartDialog from 'activity/List/StartDialog'

const useStyles = makeStyles(theme => ({
  list: {
    marginBottom: theme.mixins.toolbar.minHeight
  },
  startButton: {
    position: 'fixed',
    bottom: theme.mixins.toolbar.minHeight + theme.spacing(2),
    right: theme.spacing(2)
  }
}))

export const List = ({activities}) => {
  const classes = useStyles()

  return <MuiList className={classes.list}>
    {
      activities
        .sort((a, b) => DateTime.fromISO(a.start).diff(DateTime.fromISO(b.start)).valueOf())
        .filter(activity => activity.end !== undefined)
        .map((activity, index) => {
          let hideEndTime = false
          const next = activities[index + 1]

          if (next) {
            const currentEndTime = DateTime.fromISO(activity.end)
            const nextEndTime = next && DateTime.fromISO(next.start)
            hideEndTime = +currentEndTime === +nextEndTime
          }

          return <ActivityItem {...activity}
                               hideEndTime={hideEndTime}
                               key={`activity-${activity.id}`}/>
        })
    }
  </MuiList>
}

export default () => {
  const {loadActivitiesInRange, activities} = useActivity()
  const classes = useStyles()
  const [startDialogOpen, setStartDialogOpen] = useState(false)

  const now = DateTime.local()
  useEffect(() => {
    loadActivitiesInRange(now, now)
  }, [])

  return <>
    <StartDialog open={startDialogOpen}/>

    <DayPicker date={now}
               onChanged={d => {
                 loadActivitiesInRange(d, d)
               }}/>

    <List activities={activities}/>

    <Fab className={classes.startButton}
         onClick={() => setStartDialogOpen(true)}>
      <Add/>
    </Fab>
  </>
}
