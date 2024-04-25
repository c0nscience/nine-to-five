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
import {DatePicker, DateTimePicker, MuiPickersUtilsProvider, TimePicker} from '@material-ui/pickers'
import {DateTime} from 'luxon'
import LuxonUtils from '@date-io/luxon'
import {useActivity} from 'contexts/ActivityContext'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles({
  dense: {
    marginLeft: 0,
    marginRight: 0
  }
})

export const StartDialog = ({open, closeDialog, startActivity, repeatActivityHandler, usedTags}) => {
  const theme = useTheme()
  const classes = useStyles()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [name, setName] = useState('')
  const [tags, setTags] = useState([])
  //TODO the state gets more complicated, introduce a reducer to have it better understandable what the dataflow is
  const [showStartDateTimePicker, setShowStartDateTimePicker] = useState(false)
  const [repeatActivity, setRepeatActivity] = useState(false)
  const [startDateTime, setStartDateTime] = useState(DateTime.local())
  const [startTime, setStartTime] = useState(DateTime.local())
  const [endTime, setEndTime] = useState(DateTime.local().plus({hours: 1}))
  const [fromDate, setFromDate] = useState(DateTime.local())
  const [toDate, setToDate] = useState(DateTime.local())
  const [selectedWeekDay, setSelectedWeekDay] = useState([])
  const setWeekDay = (i, v) => a => {
    if (v) {
      return [...a, i]
    } else {
      return a.filter(e => e !== i)
    }
  }
  const isWeekDaySelected = (i, a) => a.indexOf(i) > -1
  const reset = () => {
    setName('')
    setTags([])
    setTags([])
    setShowStartDateTimePicker(false)
    setRepeatActivity(false)
    setStartDateTime(DateTime.local())
    setStartTime(DateTime.local())
    setEndTime(DateTime.local().plus({hours: 1}))
    setFromDate(DateTime.local())
    setToDate(DateTime.local())
    setSelectedWeekDay([])
  }

  return <Dialog open={open}
                 fullScreen={fullScreen}
                 TransitionProps={{
                   'onEnter': () => {
                     setStartDateTime(DateTime.local())

                     setStartTime(DateTime.local())
                     setEndTime(DateTime.local())

                     setFromDate(DateTime.local())
                     setToDate(DateTime.local())
                   },
                   'onExit': () => {
                     setShowStartDateTimePicker(false)
                     setRepeatActivity(false)
                     setName('')
                     setTags([])
                   },
                 }}>
    <DialogTitle>Start New Activity</DialogTitle>
    <DialogContent>
      <form>
        <TextField data-testid="name"
                   name="name"
                   label="Name"
                   value={name}
                   fullWidth
                   onChange={callValueWith(setName)}/>

        <TagField allowNewValues
                  data-testid="tags"
                  tags={tags}
                  setTags={setTags}
                  usedTags={usedTags}/>

        <FormControlLabel
          data-testid="change-start-date-time"
          control={<Checkbox checked={showStartDateTimePicker}
                             onChange={callValueWith(setShowStartDateTimePicker)}
                             name="showStartTimePicker"/>}
          label="Change Start Time"
        />

        <FormControlLabel
          data-testid="repeat-activity"
          control={<Checkbox checked={repeatActivity}
                             onChange={callValueWith(v => {
                               setShowStartDateTimePicker(false)
                               setRepeatActivity(v)
                             })}
                             name="repeatActivity"/>}
          label="Repeat?"
        />

        {
          showStartDateTimePicker &&
          <div data-testid="start-date-time-picker">
            <MuiPickersUtilsProvider utils={LuxonUtils}>
              <DateTimePicker label="Start"
                              ampm={false}
                              value={startDateTime}
                              minutesStep={5}
                              onChange={setStartDateTime}
                              fullWidth
                              openTo="hours"/>
            </MuiPickersUtilsProvider>
          </div>
        }
        {
          repeatActivity &&
          <>
            <div data-testid="start-time">
              <MuiPickersUtilsProvider utils={LuxonUtils}>
                <TimePicker label="Start"
                            ampm={false}
                            value={startTime}
                            minutesStep={5}
                            onChange={setStartTime}/>
              </MuiPickersUtilsProvider>
            </div>
            <div data-testid="end-time">
              <MuiPickersUtilsProvider utils={LuxonUtils}>
                <TimePicker label="End"
                            ampm={false}
                            value={endTime}
                            minutesStep={5}
                            onChange={setEndTime}/>
              </MuiPickersUtilsProvider>
            </div>

            <div data-testid="start-date">
              <MuiPickersUtilsProvider utils={LuxonUtils}>
                <DatePicker label="Start Date"
                            value={fromDate}
                            onChange={setFromDate}
                            fullWidth/>
              </MuiPickersUtilsProvider>
            </div>

            <div data-testid="end-date">
              <MuiPickersUtilsProvider utils={LuxonUtils}>
                <DatePicker label="End Date"
                            value={toDate}
                            onChange={setToDate}
                            fullWidth/>
              </MuiPickersUtilsProvider>
            </div>

            <FormControlLabel
              className={classes.dense}
              data-testid="monday"
              control={<Checkbox checked={isWeekDaySelected(1, selectedWeekDay)}
                                 onChange={callValueWith(v => {
                                   setSelectedWeekDay(setWeekDay(1, v))
                                 })}
                                 name="monday"/>}
              labelPlacement="top"
              label="Mo"
            />

            <FormControlLabel
              className={classes.dense}
              data-testid="tuesday"
              control={<Checkbox checked={isWeekDaySelected(2, selectedWeekDay)}
                                 onChange={callValueWith(v => {
                                   setSelectedWeekDay(setWeekDay(2, v))
                                 })}
                                 name="tuesday"/>}
              labelPlacement="top"
              label="Tu"
            />

            <FormControlLabel
              className={classes.dense}
              data-testid="wednesday"
              control={<Checkbox checked={isWeekDaySelected(3, selectedWeekDay)}
                                 onChange={callValueWith(v => {
                                   setSelectedWeekDay(setWeekDay(3, v))
                                 })}
                                 name="wednesday"/>}
              labelPlacement="top"
              label="We"
            />

            <FormControlLabel
              className={classes.dense}
              data-testid="thursday"
              control={<Checkbox checked={isWeekDaySelected(4, selectedWeekDay)}
                                 onChange={callValueWith(v => {
                                   setSelectedWeekDay(setWeekDay(4, v))
                                 })}
                                 name="thursday"/>}
              labelPlacement="top"
              label="Th"
            />

            <FormControlLabel
              className={classes.dense}
              data-testid="friday"
              control={<Checkbox checked={isWeekDaySelected(5, selectedWeekDay)}
                                 onChange={callValueWith(v => {
                                   setSelectedWeekDay(setWeekDay(5, v))
                                 })}
                                 name="friday"/>}
              labelPlacement="top"
              label="Fr"
            />

            <FormControlLabel
              className={classes.dense}
              data-testid="saturday"
              control={<Checkbox checked={isWeekDaySelected(6, selectedWeekDay)}
                                 onChange={callValueWith(v => {
                                   setSelectedWeekDay(setWeekDay(6, v))
                                 })}
                                 name="saturday"/>}
              labelPlacement="top"
              label="Sa"
            />

            <FormControlLabel
              className={classes.dense}
              data-testid="sunday"
              control={<Checkbox checked={isWeekDaySelected(0, selectedWeekDay)}
                                 onChange={callValueWith(v => {
                                   setSelectedWeekDay(setWeekDay(0, v))
                                 })}
                                 name="sunday"/>}
              labelPlacement="top"
              label="Su"
            />
          </>
        }
      </form>
    </DialogContent>
    <DialogActions>
      <Button data-testid="cancel-btn"
              onClick={() => closeDialog()}
              variant="contained"
              color="secondary">
        Cancel
      </Button>
      {
        !repeatActivity &&
        <Button data-testid="start-btn"
                onClick={() => startActivity({
                  name,
                  tags,
                  start: (showStartDateTimePicker && startDateTime.toUTC().toISO()) || undefined
                })}
                variant="contained"
                color="primary">Start</Button>
      }
      {
        repeatActivity &&
        <Button data-testid="apply-btn"
                onClick={() => {
                  repeatActivityHandler({
                    activity: {
                      name,
                      tags,
                      start: startTime.toUTC().toISOTime({suppressSeconds: true, includeOffset: false}),
                      end: endTime.toUTC().toISOTime({suppressSeconds: true, includeOffset: false})
                    },
                    config: {
                      from: fromDate.toUTC().toISODate(),
                      to: toDate.toUTC().toISODate(),
                      selectedDays: selectedWeekDay
                    }
                  })
                    .then(() => reset())
                }}
                variant="contained"
                color="primary">Apply</Button>
      }
    </DialogActions>
  </Dialog>
}

export default ({open, closeDialog}) => {
  const {startActivity, usedTags, loadUsedTags, loadRunning, repeatActivity} = useActivity()

  useEffect(() => {
    loadUsedTags()
  }, [])

  return <StartDialog open={open}
                      closeDialog={closeDialog}
                      usedTags={usedTags}
                      startActivity={activity => startActivity(activity)
                        .then(() => loadRunning())
                        .then(() => closeDialog())}
                      repeatActivityHandler={actWithConfig => repeatActivity(actWithConfig)
                        .then(() => closeDialog())}
  />
}
