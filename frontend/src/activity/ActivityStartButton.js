import React from 'react'
import { connect } from 'react-redux'
import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import AddIcon from 'material-ui-icons/Add'
import { CircularProgress } from 'material-ui/Progress'

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

const StartButton = ({ classes, loading, onClick, disabled }) => {
  return (
    <div className={classes.button}>
        <Button fab
                disabled={loading || disabled}
                color="primary"
                aria-label="add"
                onClick={onClick}>
          <AddIcon/>
        </Button>

      {loading && <CircularProgress size={68} className={classes.fabProgress}/>}
    </div>
  )
}

const mapStateToProps = state => ({
  loading: state.activity.loading
})

export default connect(
  mapStateToProps,
)(withStyles(styles)(StartButton))
