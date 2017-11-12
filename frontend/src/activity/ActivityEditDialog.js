import React, { Component } from 'react'
import { connect } from 'react-redux'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import Dialog, { DialogActions, DialogContent, DialogTitle,withMobileDialog } from 'material-ui/Dialog'
import { deselectActivity, saveSelectedActivity, updateSelectedActivityName } from '../reducers/activity'

class ActivityEditDialog extends Component {

  handleNameChange = event => {
    const name = event.target.value
    this.props.updateSelectedActivityName(name)
  }

  handleRequestSave = () => {
    this.props.saveSelectedActivity({
      id: this.props.id,
      name: this.props.name
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
            autoFocus
            margin="dense"
            id="name"
            label="Name"
            type="text"
            fullWidth
            value={this.props.name}
            onChange={this.handleNameChange}
          />
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
  name: state.activity.selectedActivity && state.activity.selectedActivity.name
})
const mapDispatchToProps = {
  deselectActivity,
  updateSelectedActivityName,
  saveSelectedActivity
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withMobileDialog()(ActivityEditDialog))
