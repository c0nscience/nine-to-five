import React, {useEffect, useState} from 'react'
import {TextField} from '@material-ui/core'
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
                  onClick={() => saveNewConfiguration({name, tags, threshold})
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
