import React, { Component } from 'react'
import Grid from 'material-ui/Grid'
import { connect } from 'react-redux'
import { withStyles } from 'material-ui/styles'
import ActivityList from './ActivityList'
import ActivityEditDialog from './ActivityEditDialog'
import RunningActivityItem from './RunningActivityItem'
import CreateActivityForm from './CreateActivityFrom'
import { logout } from "../reducers/auth"

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  card: {
    marginBottom: theme.spacing.unit * 3,
  },
})


class Activity extends Component {

  componentDidMount() {
    const {isAuthenticated, logout} = this.props

    if (!isAuthenticated) {
      logout()
    }
  }

  render() {
    const {classes, activities, isAuthenticated} = this.props

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
}

const mapStateToProps = state => ({
  activities: state.activity.activities,
  isAuthenticated: state.auth.isAuthenticated
})

const mapDispatchToProps = {
  logout
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Activity))
