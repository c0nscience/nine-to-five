import React, {useEffect, useState} from 'react'
import Typography from '@material-ui/core/Typography'
import makeStyles from '@material-ui/core/styles/makeStyles'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import StopButton from 'activity/RunningActivity/StopButton'
import {DateTime} from 'luxon'
import {Edit} from '@material-ui/icons'
import Fab from '@material-ui/core/Fab'

const useStyles = makeStyles(theme => ({
    paper: {
      paddingTop: theme.spacing(2),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      paddingBottom: theme.spacing(3),
      marginBottom: theme.spacing(4),
      position: 'relative'
    },
    loadingPaper: {
      paddingTop: theme.spacing(2) - 5,
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      paddingBottom: theme.spacing(4),
      marginBottom: theme.spacing(4),
      position: 'relative'
    },
    editButton: {
      margin: 0,
      top: 'auto',
      left: 'auto',
      right: theme.spacing(13),
      bottom: -theme.spacing(3),
      position: 'absolute'
    }
  })
)
const updateTimerInterval = 10000
let updateTimer

const calculateDurationFromStart = start => {
  return DateTime.local().diff(start)
}

const ElapsedTime = ({start}) => {
  const [duration, setDuration] = useState(calculateDurationFromStart(start))

  useEffect(() => {
    updateTimer = setInterval(() => {
      setDuration(calculateDurationFromStart(start))
    }, updateTimerInterval)

    return () => {
      if (updateTimer) {
        clearInterval(updateTimer)
      }
    }
  })

  return <Typography variant="h3">
    {duration.toFormat('hh:mm')}
  </Typography>
}

const cut = str => ({
  after: length => `${str.slice(0, length)}${str.length >= length ? ' ...' : ''}`
})

const RunningActivity = (props) => {
  const {id, name, start: startUtc, loading, selectActivity} = props
  const classes = useStyles()
  const localStart = DateTime.fromISO(startUtc, {zone: 'utc'}).toLocal()

  return <Paper className={loading ? classes.loadingPaper : classes.paper}>
    <Grid container spacing={0}>
      <Grid item xs={4}>
        <ElapsedTime start={localStart}/>
        <Typography variant="caption">
          since {localStart.toFormat('HH:mm')}
        </Typography>
      </Grid>
      <Grid item xs={7}>
        <Typography variant="h6">
          {cut(name).after(57)}
        </Typography>
      </Grid>
    </Grid>
    <Fab className={classes.editButton}
         aria-label="Edit"
         onClick={() => {
           selectActivity({
             id,
             name,
             start: localStart
           })
         }}>
      <Edit/>
    </Fab>
    <StopButton/>
  </Paper>

}

export default RunningActivity
