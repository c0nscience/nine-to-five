import React from 'react'
import { connect } from 'react-redux'
import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import AddIcon from '@material-ui/icons/Add'

const styles = theme => ({
  button: {
    margin: 0,
    top: 'auto',
    right: 'auto',
    left: theme.spacing.unit * 3,
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

const StartButton = ({ classes, runningRequests, onClick, disabled }) => {
  const loading = runningRequests.length > 0
  return (
    <div className={classes.button}>
        <Button variant="fab"
                disabled={loading || disabled}
                color="primary"
                aria-label="add"
                onClick={onClick}>
          <AddIcon/>
        </Button>
    </div>
  )
}

const mapStateToProps = state => ({
  runningRequests: state.network.runningRequests
})

export default connect(
  mapStateToProps,
)(withStyles(styles)(StartButton))
