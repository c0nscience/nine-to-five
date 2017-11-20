import React, { Component } from 'react'
import { connect } from 'react-redux'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import Dialog, { DialogActions, DialogContent, DialogTitle, withMobileDialog } from 'material-ui/Dialog'
import { startActivity, closeCreateDialog } from '../reducers/activity'

class ActivityEditDialog extends Component {

  constructor() {
    super()
    this.state = {
      name: '',
    }
    this.handleNameChange = this.handleNameChange.bind(this)
    this.handleRequestSave = this.handleRequestSave.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  handleNameChange(event) {
    const name = event.target.value
    this.setState({ name })
  }

  handleRequestSave(event) {
    event.preventDefault()
    this.props.startActivity(this.state.name)
  }

  handleClose(event) {
    event.preventDefault()
    this.setState({ name: '' })
    this.props.closeCreateDialog()
  }

  render() {

    const { fullScreen } = this.props

    return (
      <Dialog fullScreen={fullScreen}
              open={this.props.open}
              onRequestClose={this.handleClose}>
        <DialogTitle>Start new activity</DialogTitle>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClose}>
            Cancel
          </Button>
          <Button onClick={this.handleRequestSave} color="primary">
            Start
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

const mapStateToProps = state => ({
  open: state.activity.openCreateDialog
})
const mapDispatchToProps = {
  startActivity,
  closeCreateDialog
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withMobileDialog()(ActivityEditDialog))
