import React, {useEffect, useState} from 'react'
import {TextField} from '@material-ui/core'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Button from '@material-ui/core/Button'
import {useHistory} from 'react-router'
import Grid from '@material-ui/core/Grid'
import {TagField} from 'component/TagField'
import makeStyles from '@material-ui/core/styles/makeStyles'
import {useMetrics} from 'contexts/MetricsContext'
import {useActivity} from 'contexts/ActivityContext'
import {callValueWith} from 'functions'

const useStyles = makeStyles(theme => ({
  root: {
    position: 'absolute',
    inset: '0px',
    marginTop: theme.mixins.toolbar.minHeight,
    padding: theme.spacing(2),
    flexDirection: 'column'
  },
  center: {
    textAlign: 'center'
  },
  flex: {
    flex: '1 1 auto'
  },
  buttonContainer: {
    flex: 0
  }
}))

export const CreatePage = ({saveNewConfiguration, usedTags}) => {
  const classes = useStyles()
  const history = useHistory()
  const [name, setName] = useState('')
  const [tags, setTags] = useState([])
  const [formula, setFormula] = useState('')
  const [timeUnit, setTimeUnit] = useState('')
  const [threshold, setThreshold] = useState(0)

  return <form noValidate>
    <Grid container className={classes.root} alignItems='flex-start'>
      <Grid container item xs={12} className={classes.flex} alignContent='flex-start'>
        <Grid item xs={12}>
          <TextField data-testid='name'
                     label='Name'
                     variant='filled'
                     value={name}
                     fullWidth
                     onChange={callValueWith(setName)}/>
        </Grid>
        <Grid item xs={12}>
          <TagField data-testid='tags'
                    tags={tags}
                    setTags={setTags}
                    usedTags={usedTags}
                    allowNewValues={true}/>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={8}>
              <TextField data-testid='formula'
                         label='Formula'
                         variant='filled'
                         fullWidth
                         value={formula}
                         onChange={callValueWith(setFormula)}/>
            </Grid>
            <Grid item xs={4}>
              <FormControl variant='filled' fullWidth>
                <InputLabel id='time-unit-label'>per</InputLabel>
                <Select data-testid='time-unit'
                        labelId='time-unit-label'
                        value={timeUnit}
                        onChange={callValueWith(setTimeUnit)}>
                  <MenuItem value='WEEKS'>Week</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <TextField data-testid='threshold'
                     label='Threshold'
                     variant='filled'
                     value={threshold}
                     type='number'
                     fullWidth
                     onChange={callValueWith(setThreshold)}/>
        </Grid>
      </Grid>

      <Grid container item xs={12} justify='flex-end' className={classes.buttonContainer}>
        <Grid item xs={3} className={classes.center}>
          <Button color='secondary'
                  variant='contained'
                  data-testid='cancel-button'
                  onClick={() => history.replace('/metrics')}>
            Cancel
          </Button>
        </Grid>
        <Grid item xs={3} className={classes.center}>
          <Button color='primary'
                  variant='contained'
                  data-testid='save-button'
                  onClick={() => saveNewConfiguration({name, tags, formula, timeUnit, threshold})
                    .then(() => history.replace('/metrics'))}>
            Save
          </Button>

        </Grid>
      </Grid>
    </Grid>
  </form>
}

export default () => {
  const {saveNewMetricConfiguration} = useMetrics()
  const {usedTags, loadUsedTags} = useActivity()

  useEffect(() => {
    loadUsedTags()
  }, [])

  return <CreatePage saveNewConfiguration={saveNewMetricConfiguration} usedTags={usedTags}/>
}
