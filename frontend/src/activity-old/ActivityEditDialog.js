import React, {Component} from 'react'
import {connect} from 'react-redux'
import {deleteActivity, deselectActivity, saveActivity} from '../actions'
import moment from 'moment'
import withMobileDialog from '@material-ui/core/withMobileDialog'
import Button from '@material-ui/core/Button/Button'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField/TextField'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle/DialogTitle'
import Dialog from '@material-ui/core/Dialog'
import Grid from '@material-ui/core/Grid'

const dateFormat = 'YYYY-MM-DD'
const timeFormat = 'HH:mm'
const dateTimeFormat = `${dateFormat}T${timeFormat}`

class ActivityEditDialog extends Component {

  constructor(props) {
    super(props)
    const { id, name, start, end } = props
    this.state = {
      id,
      name,
      start,
      end,
      confirmDialogOpen: false,
      oldActivity: {
        id,
        name,
        start,
        end
      }
    }
  }

  handleNameChange = event => {
    const name = event.target.value
    this.setState({ name })
  }

  handleDate = (string, stateValue) => {
    const date = moment(string, dateFormat)
    return moment(stateValue).year(date.year()).month(date.month()).date(date.date()).toISOString(true)
  }

  handleTime = (string, stateValue) => {
    const time = moment(string, timeFormat)
    return moment(stateValue).hour(time.hour()).minute(time.minute()).toISOString(true)
  }

  handleStartDateChange = (event) => {
    const start = this.handleDate(event.target.value, this.state.start)
    this.setState({ start })
  }

  handleStartTimeChange = (event) => {
    const start = this.handleTime(event.target.value, this.state.start)
    this.setState({ start })
  }

  handleEndDateChange = (event) => {
    const end = this.handleDate(event.target.value, this.state.end)
    this.setState({ end })
  }

  handleEndTimeChange = (event) => {
    const end = this.handleTime(event.target.value, this.state.end)
    this.setState({ end })
  }

  handleRequestSave = event => {
    event.preventDefault()
    this.props.saveActivity(
      {
        id: this.state.id,
        name: this.state.name,
        start: moment(this.state.start, dateTimeFormat).utc(false).toISOString(),
        end: moment(this.state.end, dateTimeFormat).utc(false).toISOString()
      },
      this.state.oldActivity)
  }

  handleRequestDelete = event => {
    event.preventDefault()
    this.setState({
      confirmDialogOpen: false
    })
    this.props.deleteActivity(this.state.id)
  }

  handleClose = event => {
    event.preventDefault()
    this.props.deselectActivity()
  }

  handleOpenConfirmDialog = () => {
    this.setState({
      confirmDialogOpen: true
    })
  }

  handleCloseConfirmDialog = () => {
    this.setState({
      confirmDialogOpen: false
    })
  }

  render() {

    const { fullScreen } = this.props

    console.log(`render called: ${this.state.name}`)

    const ConfirmDialog = () => (
      <Dialog open={this.state.confirmDialogOpen}
              onClose={this.handleCloseConfirmDialog}>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogActions>
          <Button onClick={this.handleCloseConfirmDialog}>
            No, close!
          </Button>
          <Button onClick={this.handleRequestDelete} color="secondary">
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
                onClose={this.props.deselectActivity}>
          <DialogTitle>Edit</DialogTitle>
          <DialogContent>
            <form onSubmit={this.handleRequestSave}>
              <Grid container>
                <Grid item xs={12}>
                  <TextField
                    id="name"
                    label="Name"
                    margin="dense"
                    type="text"
                    fullWidth
                    value={this.state.name}
                    onChange={this.handleNameChange}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    id="start-date"
                    label="Start date"
                    margin="dense"
                    type="date"
                    value={moment(this.state.start).format(dateFormat)}
                    onChange={this.handleStartDateChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    id="start-time"
                    label="Time"
                    margin="dense"
                    type="time"
                    value={moment(this.state.start).format(timeFormat)}
                    onChange={this.handleStartTimeChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                {this.props.end && <Grid item xs={6}><TextField
                  id="end-date"
                  label="End date"
                  margin="dense"
                  type="date"
                  value={moment(this.state.end).format(dateFormat)}
                  onChange={this.handleEndDateChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                /></Grid>}
                {this.props.end && <Grid item xs={6}><TextField
                  id="end-time"
                  label="Time"
                  margin="dense"
                  type="time"
                  value={moment(this.state.end).format(timeFormat)}
                  onChange={this.handleEndTimeChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                /></Grid>}
              </Grid>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleOpenConfirmDialog} color="secondary">
              Delete
            </Button>
            <Button onClick={this.handleClose}>
              Cancel
            </Button>
            <Button onClick={this.handleRequestSave} disabled={this.state.name.length < 3}
                    color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}

const mapStateToProps = state => {
  return {
    open: state.activity.openEditDialog,
    id: state.activity.selectedActivity.id,
    name: state.activity.selectedActivity.name,
    start: state.activity.selectedActivity.start,
    end: state.activity.selectedActivity.end
  };
}
const mapDispatchToProps = {
  deselectActivity,
  saveActivity,
  deleteActivity
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withMobileDialog()(ActivityEditDialog))
