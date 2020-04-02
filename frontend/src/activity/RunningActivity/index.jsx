import React, {useEffect, useState} from 'react'
import Typography from '@material-ui/core/Typography'
import makeStyles from '@material-ui/core/styles/makeStyles'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import StopButton from 'activity/RunningActivity/StopButton'
import {DateTime} from 'luxon'
import {Edit} from '@material-ui/icons'
import Fab from '@material-ui/core/Fab'
import {ZERO_DURATION} from 'functions'
import Chip from '@material-ui/core/Chip'

const useStyles = makeStyles(theme => ({
    paper: {
      paddingTop: theme.spacing(2),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      paddingBottom: theme.spacing(1),
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
    },
    tagContainer: {
      display: 'flex',
      justifyContent: 'start',
      flexWrap: 'wrap',
      '& > *': {
        margin: theme.spacing(0.5)
      }
    }
  })
)
const updateTimerInterval = 10000
let updateTimer

const calculateDurationFromStart = start => {
  const duration = DateTime.local().diff(start)
  if (duration.valueOf() > 0) {
    return duration
  } else {
    return ZERO_DURATION()
  }
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

const RunningActivity = ({id, name, start: startUtc, loading, selectActivity, tags}) => {
  const classes = useStyles()
  const localStart = DateTime.fromISO(startUtc, {zone: 'utc'}).toLocal()

  return <Paper className={loading ? classes.loadingPaper : classes.paper}>
    <Grid container spacing={1}>
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
      <Grid item xs={1}/>

      <Grid item xs={12} className={classes.tagContainer}>
        {tags.map(t => <Chip size='small' label={t}/>)}
      </Grid>
    </Grid>
    <Fab className={classes.editButton}
         aria-label="Edit"
         onClick={() => {
           selectActivity({
             id,
             name,
             start: localStart,
             tags
           })
         }}>
      <Edit/>
    </Fab>
    <StopButton/>
  </Paper>

}

export default RunningActivity
