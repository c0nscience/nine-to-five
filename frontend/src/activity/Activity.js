import React, { Component } from 'react'
import Grid from 'material-ui/Grid'
import { connect } from 'react-redux'
import { withStyles } from 'material-ui/styles'
import ActivityList from './ActivityList'
import ActivityEditDialog from './ActivityEditDialog'
import RunningActivityItem from './RunningActivityItem'
import CreateActivityForm from './CreateActivityFrom'
import { logout } from '../reducers/auth'
import ErrorMessage from '../component/ErrorMessage'

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
    const { isAuthenticated, logout } = this.props

    if (!isAuthenticated) {
      logout()
    }
  }

  render() {
    const { classes, isAuthenticated, runningRequests, runningActivity } = this.props
    const loading = runningRequests.length > 0
    return (
      <div>
        <ErrorMessage/>
        <Grid container justify="center" spacing={0} className={classes.root}>
          {
            isAuthenticated &&
            <Grid item xs={12} sm={10}>
              {runningActivity && <RunningActivityItem {...runningActivity} loading={loading}/>}
              {!runningActivity && <CreateActivityForm loading={loading}/>}
              <ActivityList/>
              <ActivityEditDialog/>
            </Grid>
          }
        </Grid>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  runningActivity: state.activity.running,
  isAuthenticated: state.auth.isAuthenticated,
  runningRequests: state.network.runningRequests
})

const mapDispatchToProps = {
  logout
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Activity))
