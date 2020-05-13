import React, {useEffect} from 'react'
import Typography from '@material-ui/core/Typography'
import {formatDuration} from 'functions'
import {useMetrics} from 'contexts/MetricsContext'
import {useParams} from 'react-router'

export const Detail = ({metric = {}}) => {
  const {name, totalExceedingDuration} = metric
  return <>
    <Typography data-testid='heading'>{name}</Typography>

    <Typography data-testid='total-heading'>Total Overtime</Typography>
    <Typography data-testid='total-value'>{formatDuration(totalExceedingDuration)}</Typography>
  </>
}

export default () => {
  const {metricDetail, loadMetricDetail} = useMetrics()
  const { id } = useParams()

  useEffect(() => {
    loadMetricDetail(id)
  }, [])

  return <Detail metric={metricDetail}/>
}
