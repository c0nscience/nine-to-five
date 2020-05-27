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

const DateTimeField = ({name, date, handleInputChange}) => {
  return <DateTimePicker label={name}
                         ampm={false}
                         value={DateTime.fromISO(date)}
                         minutesStep={5}
                         onChange={handleInputChange}/>
}

const Edit = ({activity, saveActivity, cancel, usedTags}) => {
  const {id, name, start, end, tags} = activity || {id: '', name: '', start: '', end: '', tags: []}
  const [state, setState] = useState({id: '', name: '', start: '', end: '', tags: []})

  useEffect(() => {
    setState(s => ({
      ...s,
      id, name,
      start: DateTime.fromISO(start, {zone: 'utc'}).toLocal(),
      end: DateTime.fromISO(end, {zone: 'utc'}).toLocal(),
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
                    usedTags={usedTags}
                    tags={state.tags}
                    setTags={newTags => setState({
                      ...state,
                      tags: newTags
                    })}/>
        </Grid>
      </Grid>
    </form>
    {/*TODO maybe move this into a toolbar up top as a back button, to be consistent*/}
    <Button onClick={() => cancel()}>
      Cancel
    </Button>
    <Button
      onClick={() => {
        saveActivity({
          id: state.id,
          name: state.name,
          start: DateTime.fromISO(state.start).toUTC().toISO(),
          end: DateTime.fromISO(state.end).toUTC().toISO(),
          tags: state.tags
        })
      }}
      disabled={state.name.length < 3}
      color="primary">
      Save
    </Button>
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
