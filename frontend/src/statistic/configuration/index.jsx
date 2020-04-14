import React, {useEffect, useState} from 'react'
import makeStyles from '@material-ui/core/styles/makeStyles'
import {useTitle} from 'contexts/TitleContext'
import TagField from 'component/TagField'
import {TextField} from '@material-ui/core'
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

const useStyles = makeStyles(theme => ({
  card: {
    marginBottom: theme.spacing(2)
  }
}))

const Configuration = () => {
  const classes = useStyles()
  const {setTitle} = useTitle()
  const {updateConfiguration} = useStatistics()
  const statisticConfigurations = [
    {
      id: 'uuid1',
      name: 'digital:Lab',
      tags: [],
      hours: 40,
      timeUnit: 'WEEKS'
    },
    {
      id: 'uuid2',
      name: 'NIST',
      tags: [],
      hours: 40,
      timeUnit: 'WEEKS'
    },
    {
      id: 'uuid3',
      name: 'ImmoScout',
      tags: [],
      hours: 36,
      timeUnit: 'WEEKS'
    },
    {
      id: 'uuid4',
      name: 'Sprylab',
      tags: [],
      hours: 40,
      timeUnit: 'WEEKS'
    }
  ]

  const initialState = {
    configurations: statisticConfigurations.reduce((result, config) => {
        return {
          ...result,
          [config.id]: config
        }
      }
      , {})
  }

  const [state, setState] = useState(initialState)

  useEffect(() => {
    setTitle('Statistic Configuration')
  })

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
  //TODO add floating action button to add new entry
  return <form>
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
}

export default Configuration
