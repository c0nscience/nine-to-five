import React, {useEffect} from 'react'
import Typography from '@material-ui/core/Typography'
import {formatDuration} from 'functions'
import {useMetrics} from 'contexts/MetricsContext'
import {useHistory, useParams} from 'react-router'
import Grid from '@material-ui/core/Grid'
import {ResponsiveBar} from '@nivo/bar'
import {DateTime, Duration} from 'luxon'
import {DetailToolBar} from 'component/DetailToolbar'

export const Detail = ({metric = {}, deleteMetric, editMetric, back}) => {
  const {name, totalExceedingDuration = 0, values = [], threshold = 0} = metric
  const data = values.map(v => ({
    id: 'CW ' + DateTime.fromISO(v.date).toFormat('WW'),
    value: Duration.fromISO(v.duration).as('hours')
  }))

  return <>
    <DetailToolBar onBack={back}
                   onEdit={editMetric}
                   onDelete={deleteMetric}/>
    <Grid container alignContent='flex-start'>

      <Grid item xs={12}>
        <Typography variant='h5'
                    data-testid='heading'
                    align='center'
                    style={{textDecoration: 'underline'}}>{name}</Typography>
      </Grid>

      <Grid item xs={12} style={{height: '430px'}}>
        <ResponsiveBar
          data={data}
          margin={{top: 30, right: 20, bottom: 40, left: 30}}
          colors={{scheme: 'nivo'}}
          borderColor={{from: 'color', modifiers: [['darker', 1.6]]}}
          markers={[
            {
              axis: 'y',
              value: threshold,
              lineStyle: {stroke: 'rgba(0, 0, 0, .35)', strokeWidth: 2}
            }
          ]}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{from: 'color', modifiers: [['darker', 1.6]]}}
          label={d => formatDuration(Duration.fromObject({hours: d.value}))}
          animate={false}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant='subtitle2'
                    align='center'
                    data-testid='total-heading'>{`Exceeding ${name}`}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography align='center'
                    data-testid='total-value'>{formatDuration(totalExceedingDuration)}</Typography>
      </Grid>
    </Grid>
  </>
}

export default () => {
  const {metricDetail, loadMetricDetail, deleteMetricConfiguration} = useMetrics()
  const {id} = useParams()
  const history = useHistory()

  useEffect(() => {
    loadMetricDetail(id)
  }, [id])

  return <Detail metric={metricDetail}
                 back={() => history.replace('/metrics')}
                 deleteMetric={() => {
                   deleteMetricConfiguration(id)
                     .then(() => history.replace('/metrics'))
                 }}
                 editMetric={() => history.push(`/metrics/${id}/edit`)}/>
}
