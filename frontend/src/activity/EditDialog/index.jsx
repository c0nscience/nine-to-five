import React, {useEffect, useState} from 'react'
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
import {DateTime} from 'luxon'

const dateFormat = 'YYYY-MM-DD'
const timeFormat = 'HH:mm'
const dateTimeFormat = `${dateFormat}T${timeFormat}`

// const ConfirmDeleteDialog = ({open}) => <Dialog open={open}
//                                                 onClose={this.handleCloseConfirmDialog}>
//   <DialogTitle>Are you sure?</DialogTitle>
//   <DialogActions>
//     <Button onClick={this.handleCloseConfirmDialog}>
//       No, close!
//     </Button>
//     <Button onClick={this.handleRequestDelete} color="secondary">
//       Yes, delete!
//     </Button>
//   </DialogActions>
// </Dialog>

const DateTimeField = ({name, date, handleInputChange}) => {
  const dateValue = DateTime.fromISO(date).toISODate()
  const timeValue = DateTime.fromISO(date).toISOTime({
    suppressMilliseconds: true,
    suppressSeconds: true,
    includeOffset: false
  })
  return <>
    <Grid item xs={6}>
      {dateValue && <TextField
        id={`${name}-date`}
        label={`${name} date`}
        name={name}
        margin="dense"
        type="date"
        value={dateValue}
        onChange={handleInputChange}
        InputLabelProps={{
          shrink: true
        }}
      />}
    </Grid>
    <Grid item xs={6}>
      {timeValue && <TextField
        id={`${name}-time`}
        label="Time"
        name={name}
        margin="dense"
        type="time"
        value={timeValue}
        onChange={handleInputChange}
        InputLabelProps={{
          shrink: true
        }}
      />}
    </Grid>

  </>
}

const overrideValueInOriginal = (original, setOptions) => original.set(setOptions).toISO()
const handleDateValue = (dateString, stateValue) => {
  const date = DateTime.fromISO(dateString)
  if (date.isValid) {
    return overrideValueInOriginal(stateValue, {day: date.day, month: date.month, year: date.year})
  } else {
    return undefined
  }
}
const handleTimeValue = (dateString, stateValue) => {
  const date = DateTime.fromISO(dateString)
  if (date.isValid) {
    return overrideValueInOriginal(stateValue, {hour: date.hour, minute: date.minute})
  } else {
    return undefined
  }
}
const determineValueHandler = s => {
  if (s.includes('date')) {
    return handleDateValue
  } else {
    return handleTimeValue
  }
}

const EditDialog = () => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const {deselectActivity, selectedActivity, saveActivity} = useActivity()
  const {id, name, start, end} = selectedActivity || {id: '', name: '', start: '', end: ''}
  const [state, setState] = useState({
    id, name, start, end,
    deleteConfirmDialogOpen: false,
    oldActivity: {id, name, start, end}
  })

  useEffect(() => {
    setState({
      ...state,
      id, name, start, end,
      oldActivity: {id, name, start, end}
    })
  }, [selectedActivity])

  const handleInputChange = event => {
    const target = event.target
    const name = target.name
    const stateValue = DateTime.fromISO(state[name])
    const valueHandler = determineValueHandler(target.id)
    const value = valueHandler(target.value, stateValue) || target.value

    setState({
      ...state,
      [name]: value
    })
  }
  //TODO put selected activity into local component state
  //TODO handle delete and save requests in activity context
  return <>
    <Dialog fullScreen={fullScreen}
            open={typeof selectedActivity !== 'undefined'}
            onClose={deselectActivity}>
      <DialogTitle>Edit</DialogTitle>
      <DialogContent>
        <form onSubmit={() => {
        }}>
          <Grid container>
            <Grid item xs={12}>
              <TextField
                id="name"
                label="Name"
                name="name"
                margin="dense"
                type="text"
                fullWidth
                value={state.name}
                onChange={handleInputChange}
              />
            </Grid>
            <DateTimeField name='start'
                           date={state.start}
                           handleInputChange={handleInputChange}/>
            <DateTimeField name='end'
                           date={state.end}
                           handleInputChange={handleInputChange}/>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
        }} color="secondary">
          Delete
        </Button>
        <Button onClick={deselectActivity}>
          Cancel
        </Button>
        <Button onClick={() => {
          saveActivity({
            id: state.id,
            name: state.name,
            start: DateTime.fromISO(state.start).toUTC().toISO(),
            end: DateTime.fromISO(state.end).toUTC().toISO()
          }, state.oldActivity)
        }} disabled={state.name.length < 3}
                color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>

  </>
}

export default EditDialog
