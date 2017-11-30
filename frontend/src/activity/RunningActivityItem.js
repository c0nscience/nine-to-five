import React from 'react'
import { connect } from 'react-redux'
import Paper from 'material-ui/Paper'
import Typography from 'material-ui/Typography'
import IconButton from 'material-ui/IconButton'
import moment from 'moment'
import { withStyles } from 'material-ui/styles'
import Edit from 'material-ui-icons/Edit'
import { selectActivity } from '../reducers/activity'
import Grid from 'material-ui/Grid'
import StopButton from './ActivityStopButton'

const styles = theme => ({
  paper: {
    paddingTop: theme.spacing.unit * 2,
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 5,
    marginBottom: theme.spacing.unit * 3,
    position: 'relative'
  },
  name: {
    paddingLeft: theme.spacing.unit,
  },
  editButton: {
    right: '4px',
    position: 'absolute',
    top: '50%',
    marginTop: -theme.spacing.unit * 4
  }
})

const timeFormat = 'HH:mm'

const RunningActivityItem = (props) => {
  const { classes, id, name, start: startUtc } = props

  const localStart = moment.utc(startUtc).local()

  const durationAsMilliseconds = moment.duration(moment().diff(localStart)).asMilliseconds()
  return (
    <Paper className={classes.paper}>
      <Grid container spacing={0}>
        <Grid item xs={4}>
          <Typography type="display2">
            {moment.utc(durationAsMilliseconds).format(timeFormat)}
          </Typography>
          <Typography type="caption">
            since {localStart.format(timeFormat)}
          </Typography>
        </Grid>
        <Grid item xs={7}>
          <Typography type="title" className={classes.name}>
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
