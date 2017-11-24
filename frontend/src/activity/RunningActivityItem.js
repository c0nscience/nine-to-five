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
    marginTop: theme.spacing.unit,
    paddingTop: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    position: 'relative'
  },
  name: {
    paddingTop: theme.spacing.unit,
    paddingLeft: theme.spacing.unit,
  }
})

const timeFormat = 'HH:mm'

const RunningActivityItem = (props) => {
  const {classes, activities} = props
  return (
    activities.filter(activity => activity.end === undefined)
      .map(runningActivity => {
        const {id, name, start: startUtc} = runningActivity

        const localStart = moment.utc(startUtc).local()

        const durationAsMilliseconds = moment.duration(moment().diff(moment(localStart))).asMilliseconds()

        return (
          <div key={id}>
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
                <Grid item xs={8}>
                  <Typography type="title" className={classes.name}>
                    {name.slice(0, 40)}{name.length >= 40 ? ' ...' : ''}
                  </Typography>
                </Grid>
              </Grid>
              <IconButton aria-label="Edit"
                          onClick={() => {
                            props.selectActivity({
                              id,
                              name,
                              start: localStart
                            })
                          }}>
                <Edit style={{fontSize: 20}}/>
              </IconButton>
              <StopButton/>
            </Paper>
          </div>
        )
      })
  )
}

const mapStateToProps = state => ({
  activities: state.activity.activities
})
const mapDispatchToProps = {
  selectActivity
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withStyles(styles)(RunningActivityItem))
