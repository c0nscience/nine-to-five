import React, {useEffect, useState} from 'react'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import {useActivity} from 'contexts/ActivityContext'
import {DateTime} from 'luxon'
import {TagField} from 'component/TagField'
import {DateTimePicker, MuiPickersUtilsProvider} from '@material-ui/pickers'
import LuxonUtils from '@date-io/luxon'
import {useHistory, useParams} from 'react-router'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  },
  center: {
    textAlign: 'center'
  },
  buttonContainer: {
    flex: 0
  }
}))

const DateTimeField = ({name, date, handleInputChange}) => {
  return <DateTimePicker label={name}
                         ampm={false}
                         value={DateTime.fromISO(date)}
                         minutesStep={5}
                         onChange={handleInputChange}/>
}

const Edit = ({activity, saveActivity, cancel, usedTags}) => {
  const classes = useStyles()
  const {id, name, start, end, tags} = activity || {id: '', name: '', start: '', end: '', tags: []}
  const [state, setState] = useState({id: '', name: '', start: '', end: '', tags: []})

  useEffect(() => {
    setState(s => ({
      ...s,
      id, name,
      start: DateTime.fromISO(start, {zone: 'utc'}).toLocal(),
      end: end && DateTime.fromISO(end, {zone: 'utc'}).toLocal(),
      tags
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
  <form>
    <Grid container className={classes.root}>
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
        <Grid item container xs={12} justifyContent="space-between">
          <Grid item xs={4}>
          <DateTimeField name="start"
                         date={state.start}
                         handleInputChange={handleDateTimeChange('start')}/>

          </Grid>
          {state.end && <Grid item xs={4}><DateTimeField name="end"
                                       date={state.end}
                                       handleInputChange={handleDateTimeChange('end')}/></Grid>}
        </Grid>
      </MuiPickersUtilsProvider>

      <Grid item xs={12}>
        <TagField allowNewValues
                  usedTags={usedTags}
                  tags={state.tags}
                  setTags={newTags => setState({
                    ...state,
                    tags: newTags
                  })}/>
      </Grid>
    </Grid>
  </form>

  <Grid container item xs={12} justify="flex-end" className={classes.buttonContainer}>
    <Grid item xs={3} className={classes.center}>
      <Button onClick={() => cancel()}
              color="secondary"
              variant="contained">
        Cancel
      </Button>
    </Grid>
    <Grid item xs={3} className={classes.center}>
      <Button
        onClick={() => {
          saveActivity({
            id: state.id,
            name: state.name,
            start: DateTime.fromISO(state.start).toUTC().toISO(),
            end: state.end && DateTime.fromISO(state.end).toUTC().toISO(),
            tags: state.tags
          })
        }}
        disabled={state.name.length < 3}
        color="primary"
        variant="contained">
        Save
      </Button>
    </Grid>
  </Grid>
</>
}

export default () => {
  const {id} = useParams()
  const {activity, loadActivity, saveActivity, loadUsedTags, usedTags} = useActivity()
  const history = useHistory()

  useEffect(() => {
    loadActivity(id)
    loadUsedTags()
  }, [id])

  return <Edit activity={activity}
               cancel={() => history.goBack()}
               usedTags={usedTags}
               saveActivity={activity => {
                 saveActivity(activity)
                   .then(() => history.replace(`/activities/${id}`))
               }}/>
}
