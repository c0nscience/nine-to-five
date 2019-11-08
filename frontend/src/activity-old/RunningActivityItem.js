import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import moment from 'moment'
import { withStyles } from '@material-ui/core/styles'
import Edit from '@material-ui/icons/Edit'
import { selectActivity } from '../actions'
import StopButton from './ActivityStopButton'
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";


const styles = theme => ({
  paper: {
    paddingTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(5),
    marginBottom: theme.spacing(4),
    position: 'relative'
  },
  loadingPaper: {
    paddingTop: theme.spacing(2) - 5,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(6),
    marginBottom: theme.spacing(4),
    position: 'relative'
  },
  name: {
    paddingLeft: theme.spacing(),
  },
  editButton: {
    right: '4px',
    position: 'absolute',
    top: '50%',
    marginTop: -theme.spacing(4)
  }
})

const timeFormat = 'HH:mm'
let updateTimer

const calculateDurationFromStart = (start) => {
  const localStart = moment.utc(start).local()
  return moment.duration(moment().diff(localStart)).asMilliseconds()
}

const ElapsedTime = ({ start }) => {
  const [duration, setDuration] = useState(calculateDurationFromStart(start));
  console.log('duration', duration)

  useEffect(() => {
    updateTimer = setInterval(() => {
      setDuration(calculateDurationFromStart(start))
    }, 60000)

    return () => {
      if (updateTimer) {
        clearInterval(updateTimer)
      }
    }
  })

  return <Typography variant="h3">
    {moment.utc(duration).format(timeFormat)}
  </Typography>
}

const RunningActivityItem = (props) => {
  const { classes, id, name, start: startUtc, loading } = props
  const localStart = moment.utc(startUtc).local()

  return (
    <Paper className={classNames({
      [classes.loadingPaper]: loading,
      [classes.paper]: !loading
    })}>
      <Grid container spacing={0}>
        <Grid item xs={4}>
          <ElapsedTime start={startUtc}/>
          <Typography variant="caption">
            since {localStart.format(timeFormat)}
          </Typography>
        </Grid>
        <Grid item xs={7}>
          <Typography variant="h6" className={classes.name}>
            {name.slice(0, 57)}{name.length >= 57 ? ' ...' : ''}
          </Typography>
        </Grid>
      </Grid>
      <IconButton className={classes.editButton}
                  aria-label="Edit"
                  onClick={() => {
                    props.selectActivity({
                      id,
                      name,
                      start: localStart
                    })
                  }}>
        <Edit/>
      </IconButton>
      <StopButton/>
    </Paper>
  )
}

const mapDispatchToProps = {
  selectActivity
}

export default connect(
  null,
  mapDispatchToProps,
)(withStyles(styles)(RunningActivityItem))
