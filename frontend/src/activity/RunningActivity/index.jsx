import React, {useEffect, useState} from 'react'
import Typography from '@material-ui/core/Typography'
import makeStyles from '@material-ui/core/styles/makeStyles'
import {extendedDayjs as dayjs, formatMinutesAsHours} from 'extendedDayjs'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import StopButton from 'activity/RunningActivity/StopButton'

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
    }
  })
)
const timeFormat = 'HH:mm'
const updateTimerInterval = 10000
let updateTimer

const calculateDurationFromStart = (start) => {
  const localStart = dayjs.utc(start).local()
  return dayjs().diff(localStart, 'minute')
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
    {formatMinutesAsHours(duration)}
  </Typography>
}

const RunningActivity = (props) => {
  const {id, name, start: startUtc, loading} = props
  const classes = useStyles()
  const localStart = dayjs.utc(startUtc).local()

  return <Paper className={loading ? classes.loadingPaper : classes.paper}>
    <Grid container spacing={0}>
      <Grid item xs={4}>
        <ElapsedTime start={startUtc}/>
        <Typography variant="caption">
          since {localStart.format(timeFormat)}
        </Typography>
      </Grid>
      <Grid item xs={7}>
        <Typography variant="h6">
          {name.slice(0, 57)}{name.length >= 57 ? ' ...' : ''}
        </Typography>
      </Grid>
    </Grid>
    <StopButton/>
  </Paper>

}

export default RunningActivity
