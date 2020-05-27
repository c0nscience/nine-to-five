import React, {useEffect, useState} from 'react'
import Dialog from '@material-ui/core/Dialog'
import {DialogTitle, useMediaQuery} from '@material-ui/core'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import useTheme from '@material-ui/core/styles/useTheme'
import TextField from '@material-ui/core/TextField'
import {TagField} from 'component/TagField'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import {callValueWith} from 'functions'
import {DateTimePicker, MuiPickersUtilsProvider} from '@material-ui/pickers'
import {DateTime} from 'luxon'
import LuxonUtils from '@date-io/luxon'
import {useActivity} from 'contexts/ActivityContext'

export const StartDialog = ({open, closeDialog, startActivity, usedTags}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [name, setName] = useState('')
  const [tags, setTags] = useState([])
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [startTime, setStartTime] = useState(DateTime.local())

  return <Dialog open={open}
                 fullScreen={fullScreen}>
    <DialogTitle>Start New Activity</DialogTitle>
    <DialogContent>
      <form>
        <TextField data-testid='name'
                   name='name'
                   label='Name'
                   value={name}
                   onChange={callValueWith(setName)}/>

        <TagField allowNewValues
                  data-testid='tags'
                  tags={tags}
                  setTags={setTags}
                  usedTags={usedTags}/>

        <FormControlLabel
          data-testid='change-start-time'
          control={<Checkbox checked={showStartTimePicker}
                             onChange={callValueWith(setShowStartTimePicker)}
                             name="showStartTimePicker"/>}
          label="Change Start Time"
        />

        {
          showStartTimePicker &&
          <div data-testid='start-time-picker'>
            <MuiPickersUtilsProvider utils={LuxonUtils}>
              <DateTimePicker label='Start'
                              ampm={false}
                              value={startTime}
                              minutesStep={5}
                              onChange={d => setStartTime(d)}
                              openTo='hours'
                              variant='static'/>
            </MuiPickersUtilsProvider>
          </div>
        }
      </form>
    </DialogContent>
    <DialogActions>
      <Button data-testid='cancel-btn'
              onClick={() => closeDialog()}>Cancel</Button>
      <Button data-testid='start-btn'
              onClick={() => startActivity({
                name,
                tags,
                start: showStartTimePicker && startTime.toUTC().toISO() || undefined
              })}>Start</Button>
    </DialogActions>
  </Dialog>
}

export default ({open, closeDialog}) => {
  const {startActivity, usedTags, loadUsedTags} = useActivity()

  useEffect(() => {
    loadUsedTags()
  }, [])

  return <StartDialog open={open}
                      closeDialog={closeDialog}
                      usedTags={usedTags}
                      startActivity={activity => startActivity(activity)
                        .then(() => closeDialog())}
  />
}
