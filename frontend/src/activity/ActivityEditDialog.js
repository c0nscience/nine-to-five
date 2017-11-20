import React, { Component } from 'react'
import { connect } from 'react-redux'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import Dialog, { DialogActions, DialogContent, DialogTitle, withMobileDialog } from 'material-ui/Dialog'
import { deselectActivity, saveSelectedActivity, } from '../reducers/activity'
import moment from 'moment'

const dateTimeFormat = 'YYYY-MM-DDTHH:mm'
const initState = {
  id: '',
  name: '',
  start: '',
  end: ''
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
    this.props.saveSelectedActivity({
      id: this.state.id,
      name: this.state.name,
      start: moment(this.state.start, dateTimeFormat).utc(false).toISOString(),
      end: moment(this.state.end, dateTimeFormat).utc(false).toISOString()
    })
  }

  handleClose(event) {
    event.preventDefault()
    this.setState(initState)
    this.props.deselectActivity()
  }

  render() {

    const { fullScreen } = this.props

    return (
      <Dialog fullScreen={fullScreen}
              open={this.props.open}
              onRequestClose={this.props.deselectActivity}>
        <DialogTitle>Edit</DialogTitle>
        <DialogContent>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={this.handleRequestSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
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
  saveSelectedActivity
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withMobileDialog()(ActivityEditDialog))
