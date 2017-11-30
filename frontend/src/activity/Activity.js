import React from 'react'
import Grid from 'material-ui/Grid'
import { connect } from 'react-redux'
import { withStyles } from 'material-ui/styles'
import ActivityList from './ActivityList'
import ActivityEditDialog from './ActivityEditDialog'
import RunningActivityItem from './RunningActivityItem'
import CreateActivityForm from './CreateActivityFrom'

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  card: {
    marginBottom: theme.spacing.unit * 3,
  },
})


const Activity = ({ classes, activities, isAuthenticated }) => {
  const runningActivity = activities.find(activity => activity.end === undefined)
  return (
    <Grid container justify="center" spacing={0} className={classes.root}>
      {
        isAuthenticated &&
        <Grid item xs={12} sm={10}>
          {runningActivity && <RunningActivityItem {...runningActivity}/>}
          {!runningActivity && <CreateActivityForm/>}
          <ActivityList/>
          <ActivityEditDialog/>
        </Grid>
      }
    </Grid>
  )
}
const mapStateToProps = state => ({
  activities: state.activity.activities,
  isAuthenticated: state.auth.isAuthenticated
})

export default connect(mapStateToProps)(withStyles(styles)(Activity))
