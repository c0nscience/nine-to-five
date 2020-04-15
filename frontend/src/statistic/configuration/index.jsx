import React, {useEffect, useState} from 'react'
import makeStyles from '@material-ui/core/styles/makeStyles'
import {useTitle} from 'contexts/TitleContext'
import TagField from 'component/TagField'
import {TextField, useMediaQuery} from '@material-ui/core'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Grid from '@material-ui/core/Grid'
import InputLabel from '@material-ui/core/InputLabel'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import CardActions from '@material-ui/core/CardActions'
import Button from '@material-ui/core/Button'
import {useStatistics} from 'contexts/StatisticContext'
import Fab from '@material-ui/core/Fab'
import {Add} from '@material-ui/icons'
import Dialog from '@material-ui/core/Dialog'
import useTheme from '@material-ui/core/styles/useTheme'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'

const useStyles = makeStyles(theme => ({
  card: {
    marginBottom: theme.spacing(2)
  },
  addButton: {
    position: 'fixed',
    right: theme.spacing(2),
    bottom: theme.spacing(2),
    zIndex: theme.zIndex.speedDial + 1
  }
}))

const CreateConfigurationButton = ({openCreateDialog}) => {
  const classes = useStyles()
  return <Fab color="primary"
              aria-label="add"
              className={classes.addButton}
              onClick={() => openCreateDialog()}>
    <Add/>
  </Fab>
}

const CreateDialog = ({open, close, create}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [state, setState] = useState({
    name: '',
    hours: 0.0,
    timeUnit: 'WEEKS',
    tags: []
  })

  const handleInputChange = property =>
    e => {
      const value = e.target.value
      setState(s => ({...s, [property]: value}))
    }

  return <Dialog fullScreen={fullScreen}
                 open={open}>
    <DialogTitle>Create New Configuration</DialogTitle>
    <DialogContent>
      <Grid container spacing={1}>
        <Grid item xs={8}>
          <TextField label='Name'
                     value={state.name}
                     fullWidth
                     onChange={handleInputChange('name')}/>

        </Grid>
        <Grid item xs={2}>
          <TextField label='Hours'
                     value={state.hours}
                     onChange={handleInputChange('hours')}/>
        </Grid>
        <Grid item xs={2}>
          <InputLabel id='time-unit-label-create' shrink>per</InputLabel>
          <Select labelId='time-unit-label-create'
                  value={state.timeUnit}
                  onChange={handleInputChange('timeUnit')}>
            <MenuItem value='WEEKS'>Week</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={12}>
          <TagField tags={state.tags}
                    setTags={newTags => {
                      setState(s => ({...s, tags: newTags}))
                    }}/>
        </Grid>
      </Grid>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => close()}>
        Close
      </Button>
      <Button onClick={() => {
        close()
        create({...state})
      }}>
        Create
      </Button>
    </DialogActions>
  </Dialog>
}

const Configuration = () => {
  const classes = useStyles()
  const {setTitle} = useTitle()
  const {configurations, updateConfiguration, createConfiguration, loadConfigurations} = useStatistics()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const [state, setState] = useState({
    configurations: []
  })

  useEffect(() => {
    setTitle('Statistic Configuration')
    setState({
      configurations: configurations.reduce((result, config) => {
          return {
            ...result,
            [config.id]: config
          }
        }
        , {})

    })
  }, [configurations])

  const updateConfigurationProperty = (name, property, value) => s => {
    return {
      ...s,
      configurations: {
        ...s.configurations,
        [name]: {
          ...s.configurations[name],
          [property]: value
        }
      }
    }
  }

  const handleOnChange = (name, property) => e => {
    const value = e.target.value
    setState(updateConfigurationProperty(name, property, value))
  }

  return <>
    <CreateDialog open={createDialogOpen}
                  close={() => setCreateDialogOpen(false)}
                  create={newConfig => createConfiguration(newConfig)}/>
    <CreateConfigurationButton openCreateDialog={() => setCreateDialogOpen(true)}/>
    <form>
      {Object.entries(state.configurations)
        .map(([name, config]) =>
          <Card key={config.id}
                className={classes.card}
                square>
            <CardHeader title={config.name}/>
            <CardContent>
              <Grid container spacing={1}>
                <Grid item xs={8}>
                  <TextField label='Name'
                             value={config.name}
                             fullWidth
                             onChange={handleOnChange(name, 'name')}/>

                </Grid>
                <Grid item xs={2}>
                  <TextField label='Hours'
                             value={config.hours}
                             onChange={handleOnChange(name, 'hours')}/>
                </Grid>
                <Grid item xs={2}>
                  <InputLabel id={`time-unit-label-${config.id}`} shrink>per</InputLabel>
                  <Select labelId={`time-unit-label-${config.id}`}
                          value={config.timeUnit}>
                    <MenuItem value='WEEKS'>Week</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={12}>
                  <TagField tags={config.tags}
                            setTags={newTags => {
                              setState(updateConfigurationProperty(name, 'tags', newTags))
                            }}/>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              <Button onClick={() => updateConfiguration(config)}>Save</Button>
            </CardActions>
          </Card>
        )}
    </form>
  </>
}

export default Configuration
