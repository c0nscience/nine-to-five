import React, { Component } from 'react'
import { connect } from 'react-redux'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import Dialog, { DialogActions, DialogContent, DialogTitle, withMobileDialog } from 'material-ui/Dialog'
import { deselectActivity, saveSelectedActivity, updateSelectedActivityName, updateSelectedActivityStart, updateSelectedActivityEnd } from '../reducers/activity'
import moment from 'moment'

const dateTimeFormat = 'YYYY-MM-DDTHH:mm'

class ActivityEditDialog extends Component {

  handleNameChange = event => {
    const name = event.target.value
    this.props.updateSelectedActivityName(name)
  }

  handleStartChange = event => {
    const start = event.target.value
    this.props.updateSelectedActivityStart(start)
  }

  handleEndChange = event => {
    const end = event.target.value
    this.props.updateSelectedActivityEnd(end)
  }

  handleRequestSave = () => {
    this.props.saveSelectedActivity({
      id: this.props.id,
      name: this.props.name,
      start: moment(this.props.start, dateTimeFormat).utc(false).toISOString(),
      end: moment(this.props.end, dateTimeFormat).utc(false).toISOString()
    })
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
            autoFocus
            margin="dense"
            type="text"
            fullWidth
            value={this.props.name}
            onChange={this.handleNameChange}
          />
          <TextField
            id="start"
            label="Start"
            margin="dense"
            type="datetime-local"
            fullWidth
            value={moment(this.props.start).format(dateTimeFormat)}
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
            value={moment(this.props.end).format(dateTimeFormat)}
            onChange={this.handleEndChange}
            InputLabelProps={{
              shrink: true,
            }}
          />}
        </DialogContent>
        <DialogActions>
          <Button onClick={this.props.deselectActivity} color="primary">
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
  open: state.activity.selectedActivity !== undefined,
  id: state.activity.selectedActivity && state.activity.selectedActivity.id,
  name: state.activity.selectedActivity && state.activity.selectedActivity.name,
  start: state.activity.selectedActivity && state.activity.selectedActivity.start,
  end: state.activity.selectedActivity && state.activity.selectedActivity.end
})
const mapDispatchToProps = {
  deselectActivity,
  updateSelectedActivityName,
  updateSelectedActivityStart,
  updateSelectedActivityEnd,
  saveSelectedActivity
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withMobileDialog()(ActivityEditDialog))
