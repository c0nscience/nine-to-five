import React from 'react'
import { connect } from 'react-redux'
import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import AddIcon from 'material-ui-icons/Add'
import { CircularProgress } from 'material-ui/Progress'
import { openCreateDialog } from '../reducers/activity'

const styles = theme => ({
  button: {
    margin: 0,
    top: 'auto',
    left: 'auto',
    right: theme.spacing.unit * 3,
    bottom: theme.spacing.unit * 3,
    position: 'fixed'
  },
  fabProgress: {
    position: 'absolute',
    top: -6,
    left: -6,
    zIndex: 1,
  }
})

const ControlButton = ({ classes, loading, openCreateDialog }) => (
  <div className={classes.button}>
    <Button fab
            disabled={loading}
            color="primary"
            aria-label="add"
            onClick={openCreateDialog}>
      <AddIcon/>
    </Button>
    {loading && <CircularProgress size={68} className={classes.fabProgress} />}
  </div>
)

const mapStateToProps = state => ({
  loading: state.activity.loading
})

const mapDispatchToProps = {
  openCreateDialog
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withStyles(styles)(ControlButton))
