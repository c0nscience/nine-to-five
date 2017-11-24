import React from 'react'
import { connect } from 'react-redux'
import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import StopIcon from 'material-ui-icons/Stop'
import { CircularProgress } from 'material-ui/Progress'
import { stopActivity } from '../reducers/activity'

const styles = theme => ({
  button: {
    margin: 0,
    top: 'auto',
    left: 'auto',
    right: theme.spacing.unit * 3,
    bottom: - theme.spacing.unit * 3,
    position: 'absolute'
  },
  fabProgress: {
    position: 'absolute',
    top: -6,
    left: -6,
    zIndex: 1,
  }
})

const StopButton = ({ classes, loading, stopActivity }) => {
  return (
    <div className={classes.button}>
      <Button fab
              disabled={loading}
              color="accent"
              aria-label="stop"
              onClick={stopActivity}>
        <StopIcon/>
      </Button>
      {loading && <CircularProgress size={68} className={classes.fabProgress}/>}
    </div>
  )
}

const mapStateToProps = state => ({
  loading: state.activity.loading,
})

const mapDispatchToProps = {
  stopActivity
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withStyles(styles)(StopButton))
