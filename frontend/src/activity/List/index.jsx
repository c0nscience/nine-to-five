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
import Card from '@material-ui/core/Card'
import {CardHeader} from '@material-ui/core'
import Chip from '@material-ui/core/Chip'
import {formatDuration} from 'functions'
import Typography from '@material-ui/core/Typography'
import {useHistory} from 'react-router'

const useStyles = makeStyles(theme => ({
  list: {
    marginBottom: theme.mixins.toolbar.minHeight
  },
  startButton: {
    position: 'fixed',
    bottom: theme.mixins.toolbar.minHeight + theme.spacing(2),
    right: theme.spacing(2)
  },
  runningStartButton: {
    position: 'fixed',
    bottom: theme.mixins.toolbar.minHeight + theme.spacing(12),
    right: theme.spacing(2)
  },
  runningCard: {
    position: 'fixed',
    width: '100%',
    bottom: theme.mixins.toolbar.minHeight + theme.spacing(1)
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
  const {loadActivitiesInRange, activities, loadRunning, running} = useActivity()
  const classes = useStyles()
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const history = useHistory()

  const now = DateTime.local()
  useEffect(() => {
    loadActivitiesInRange(now, now)
    loadRunning()
  }, [])

  let duration
  if (running) {
    const start = DateTime.fromISO(running.start, {zone: 'utc'}).toLocal()
    duration = now.diff(start)
  }

  return <>
    <StartDialog open={startDialogOpen}
                 closeDialog={() => setStartDialogOpen(false)}/>

    <DayPicker date={now}
               onChanged={d => {
                 loadActivitiesInRange(d, d)
               }}/>

    <List activities={activities}/>

    <Fab className={running ? classes.runningStartButton : classes.startButton}
         onClick={() => setStartDialogOpen(true)}>
      <Add/>
    </Fab>

    {/*TODO figure out how this is supposed to work*/}
    {/*TODO ok that feels so dirty right now ...*/}
    {
      running &&
      <Card className={classes.runningCard}
            variant='outlined'
            square>
        <CardHeader title={running.name}
                    onClick={() => history.push(`/activities/${running.id}`)}
                    subheader={<div className={classes.tagContainer}>
                      {running.tags.map(t => <Chip key={t} label={t} size='small'/>)}
                    </div>}
                    avatar={<Typography variant='h6'
                                        aria-label="worked duration">
                      {formatDuration(duration)}
                    </Typography>}/>
      </Card>
    }
  </>
}
