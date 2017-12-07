import React, { Component } from 'react'
import { connect } from 'react-redux'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import Dialog, { DialogActions, DialogContent, DialogTitle, withMobileDialog } from 'material-ui/Dialog'
import { deleteActivity, deselectActivity, saveActivity } from '../actions'
import moment from 'moment'

const dateTimeFormat = 'YYYY-MM-DDTHH:mm'
const initState = {
  id: '',
  name: '',
  start: '',
  end: '',
  confirmDialogOpen: false
}

class ActivityEditDialog extends Component {

  constructor() {
    super()
    this.state = initState
    this.handleNameChange = this.handleNameChange.bind(this)
    this.handleStartChange = this.handleStartChange.bind(this)
    this.handleEndChange = this.handleEndChange.bind(this)
    this.handleRequestSave = this.handleRequestSave.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleRequestDelete = this.handleRequestDelete.bind(this)
    this.handleOpenConfirmDialog = this.handleOpenConfirmDialog.bind(this)
    this.handleCloseConfirmDialog = this.handleCloseConfirmDialog.bind(this)
  }

  componentWillReceiveProps({ id, name, start, end }) {
    this.setState({
      id,
      name,
      start,
      end
    })

  }

  handleNameChange(event) {
    const name = event.target.value
    this.setState({ name })
  }

  handleStartChange(event) {
    const start = event.target.value
    this.setState({ start })
  }

  handleEndChange(event) {
    const end = event.target.value
    this.setState({ end })
  }

  handleRequestSave(event) {
    event.preventDefault()
    this.props.saveActivity({
      id: this.state.id,
      name: this.state.name,
      start: moment(this.state.start, dateTimeFormat).utc(false).toISOString(),
      end: moment(this.state.end, dateTimeFormat).utc(false).toISOString()
    })
  }

  handleRequestDelete(event) {
    event.preventDefault()
    this.setState({
      confirmDialogOpen: false
    })
    this.props.deleteActivity(this.state.id)
  }

  handleClose(event) {
    event.preventDefault()
    this.setState(initState)
    this.props.deselectActivity()
  }

  handleOpenConfirmDialog() {
    this.setState({
      confirmDialogOpen: true
    })
  }

  handleCloseConfirmDialog() {
    this.setState({
      confirmDialogOpen: false
    })
  }

  render() {

    const { fullScreen } = this.props

    const ConfirmDialog = () => (
      <Dialog open={this.state.confirmDialogOpen}
              onRequestClose={this.handleCloseConfirmDialog}>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogActions>
          <Button onClick={this.handleCloseConfirmDialog}>
            No, close!
          </Button>
          <Button onClick={this.handleRequestDelete} color="accent">
            Yes, delete!
          </Button>
        </DialogActions>
      </Dialog>
    )

    return (
      <div>
        <ConfirmDialog/>
        <Dialog fullScreen={fullScreen}
                open={this.props.open}
                onRequestClose={this.props.deselectActivity}>
          <DialogTitle>Edit</DialogTitle>
          <DialogContent>
            <form onSubmit={this.handleRequestSave}>
              <TextField
                id="name"
                label="Name"
                margin="dense"
                type="text"
                fullWidth
                value={this.state.name}
                onChange={this.handleNameChange}
              />
              <TextField
                id="start"
                label="Start"
                margin="dense"
                type="datetime-local"
                fullWidth
                value={moment(this.state.start).format(dateTimeFormat)}
                onChange={this.handleStartChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              {this.props.end && <TextField
                id="end"
                label="End"
                margin="dense"
                type="datetime-local"
                fullWidth
                value={moment(this.state.end).format(dateTimeFormat)}
                onChange={this.handleEndChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />}
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleOpenConfirmDialog} color="accent">
              Delete
            </Button>
            <Button onClick={this.handleClose}>
              Cancel
            </Button>
            <Button onClick={this.handleRequestSave} disabled={this.state.name && this.state.name.length < 3}
                    color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  open: state.activity.openEditDialog,
  id: state.activity.selectedActivity.id,
  name: state.activity.selectedActivity.name,
  start: state.activity.selectedActivity.start,
  end: state.activity.selectedActivity.end
})
const mapDispatchToProps = {
  deselectActivity,
  saveActivity,
  deleteActivity
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withMobileDialog()(ActivityEditDialog))
