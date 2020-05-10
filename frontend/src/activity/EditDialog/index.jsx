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
import TagField from 'component/TagField'
import {DateTimePicker, MuiPickersUtilsProvider} from '@material-ui/pickers'
import LuxonUtils from '@date-io/luxon'

const ConfirmDeleteDialog = ({open, handleCloseDialog, handleDelete}) => <Dialog open={open}
                                                                                 onClose={handleCloseDialog}>
  <DialogTitle>Are you sure?</DialogTitle>
  <DialogActions>
    <Button onClick={handleCloseDialog}>
      No, close!
    </Button>
    <Button onClick={handleDelete} color="secondary">
      Yes, delete!
    </Button>
  </DialogActions>
</Dialog>

const DateTimeField = ({name, date, handleInputChange}) => {
  return <DateTimePicker label={name}
                         ampm={false}
                         value={DateTime.fromISO(date)}
                         minutesStep={5}
                         onChange={handleInputChange}/>
}

const EditDialog = () => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const {deselectActivity, selectedActivity, saveActivity, deleteActivity, usedTags} = useActivity()
  const {id, name, start, end, tags} = selectedActivity || {id: '', name: '', start: '', end: '', tags: []}
  const [state, setState] = useState({
    id, name, start, end, tags,
    deleteConfirmDialogOpen: false,
    oldActivity: {id, name, start, end, tags}
  })

  useEffect(() => {
    setState(s => ({
      ...s,
      id, name, start, end, tags,
      oldActivity: {id, name, start, end, tags}
    }))
  }, [id, name, start, end])

  const handleNameChange = e => {
    const target = e.target
    setState(s => ({
      ...s,
      name: target.value
    }))
  }

  const handleDateTimeChange = field => newDate => setState(s => ({
    ...s,
    [field]: newDate.toISO()
  }))

  return <>
    <ConfirmDeleteDialog open={state.deleteConfirmDialogOpen}
                         handleCloseDialog={() => setState({...state, deleteConfirmDialogOpen: false})}
                         handleDelete={() => {
                           setState({...state, deleteConfirmDialogOpen: false})
                           deleteActivity(state.id)
                         }}/>
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
                onChange={handleNameChange}
              />
            </Grid>

            <MuiPickersUtilsProvider utils={LuxonUtils}>
              <DateTimeField name='start'
                             date={state.start}
                             handleInputChange={handleDateTimeChange('start')}/>

              {state.end && <DateTimeField name='end'
                                           date={state.end}
                                           handleInputChange={handleDateTimeChange('end')}/>}
            </MuiPickersUtilsProvider>

            <Grid item xs={12}>
              <TagField allowNewValues
                        tags={tags}
                        setTags={newTags => setState({
                          ...state,
                          tags: newTags
                        })}/>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setState({...state, deleteConfirmDialogOpen: true})}
                color="secondary">
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
            end: DateTime.fromISO(state.end).toUTC().toISO(),
            tags: state.tags
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
