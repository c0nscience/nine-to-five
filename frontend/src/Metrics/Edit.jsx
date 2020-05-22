import React, {useEffect, useState} from 'react'
import {TextField} from '@material-ui/core'
import {TagField} from 'component/TagField'
import {useMetrics} from 'contexts/MetricsContext'
import {useHistory, useParams} from 'react-router'
import Button from '@material-ui/core/Button'
import {callValueWith} from 'functions'

export const Edit = ({metricConfiguration = {name: '', formula: '', tags: [], unit: '', threshold: 0}, save}) => {
  const [name, setName] = useState('')
  const [formula, setFormula] = useState('')
  const [tags, setTags] = useState([])
  const [unit, setUnit] = useState('')
  const [threshold, setThreshold] = useState(0)

  useEffect(() => {
    setName(metricConfiguration.name)
    setFormula(metricConfiguration.formula)
    setTags(metricConfiguration.tags)
    setUnit(metricConfiguration.unit)
    setThreshold(metricConfiguration.threshold)
  }, [metricConfiguration.name, metricConfiguration.formula, metricConfiguration.tags, metricConfiguration.unit, metricConfiguration.threshold])

  return <form data-testid='form'>
    <TextField label='Name'
               name='name'
               value={name}
               onChange={callValueWith(setName)}/>

    <TextField label='Formula'
               name='formula'
               value={formula}
               onChange={callValueWith(setFormula)}/>

    <TagField tags={tags}
              setTags={setTags}
              usedTags={[]}
              allowNewValues={true}/>

    <TextField label='Unit'
               name='unit'
               value={unit}
               onChange={callValueWith(setUnit)}/>

    <TextField label='Threshold'
               name='threshold'
               type='number'
               value={threshold}
               onChange={callValueWith(setThreshold)}/>

    <Button onClick={() => save({id: metricConfiguration.id, name, formula, tags, unit, threshold})}>Save</Button>
  </form>
}

export default () => {
  const {configuration, loadMetricConfiguration, saveMetricConfiguration} = useMetrics()
  const {id} = useParams()
  const history = useHistory()

  useEffect(() => {
    loadMetricConfiguration(id)
  }, [id])

  return <>
    {configuration && <Edit metricConfiguration={{id, ...configuration}}
           save={config => {
             saveMetricConfiguration(config)
               .then(() => history.replace(`/metrics/${id}`))
           }}/>}
  </>
}
