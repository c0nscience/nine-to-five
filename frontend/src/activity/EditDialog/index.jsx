import React from 'react'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import {useMediaQuery} from '@material-ui/core'
import useTheme from '@material-ui/core/styles/useTheme'
import DialogContent from '@material-ui/core/DialogContent'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import {useActivity} from 'contexts/ActivityContext'

const ConfirmDeleteDialog = ({open}) => <Dialog open={open}
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


const Dialog = () => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const {deselectActivity, selectedActivity} = useActivity()
  //TODO put selected activity into local component state
  //TODO handle delete and save requests in activity context
  return <>
    <Dialog fullScreen={fullScreen}
            open={typeof selectedActivity !== 'undefined'}
            onClose={deselectActivity}>
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
                  shrink: true
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
                  shrink: true
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
                shrink: true
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
                shrink: true
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

  </>
}

export default Dialog
