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


const Activity = ({ classes, activities }) => {
  const runningActivity = activities.find(activity => activity.end === undefined)
  return (
  <Grid container justify="center" spacing={0} className={classes.root}>
    <Grid item xs={12} sm={10}>
      {runningActivity && <RunningActivityItem runningActivity={runningActivity}/>}
      {!runningActivity && <CreateActivityForm />}
      <ActivityList/>
      <ActivityEditDialog />
    </Grid>
  </Grid>
)
}
const mapStateToProps = state => ({
  activities: state.activity.activities
})

export default connect(mapStateToProps)(withStyles(styles)(Activity))
