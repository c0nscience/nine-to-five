import React from 'react'
import {connect} from 'react-redux'
import {withStyles} from '@material-ui/core/styles'
import StopIcon from '@material-ui/icons/Stop'
import {stopActivity} from '../actions'
import {Fab} from "@material-ui/core";

const styles = theme => ({
  button: {
    margin: 0,
    top: 'auto',
    right: 'auto',
    left: theme.spacing(3),
    bottom: -theme.spacing(3),
    position: 'absolute'
  },
  fabProgress: {
    position: 'absolute',
    top: -6,
    left: -6,
    zIndex: 1,
  }
})

const StopButton = ({classes, runningRequests, stopActivity}) => {
  const loading = runningRequests.length > 0
  return (
    <div className={classes.button}>
      <Fab disabled={loading}
           color="secondary"
           aria-label="stop"
           onClick={stopActivity}>
        <StopIcon/>
      </Fab>
    </div>
  )
}

const mapStateToProps = state => ({
  runningRequests: state.network.runningRequests
})

const mapDispatchToProps = {
  stopActivity
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withStyles(styles)(StopButton))
