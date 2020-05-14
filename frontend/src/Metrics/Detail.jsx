import React, {useEffect} from 'react'
import Typography from '@material-ui/core/Typography'
import {formatDuration} from 'functions'
import {useMetrics} from 'contexts/MetricsContext'
import {useParams} from 'react-router'
import Grid from '@material-ui/core/Grid'
import {ResponsiveBar} from '@nivo/bar'
import {DateTime, Duration} from 'luxon'
import makeStyles from '@material-ui/core/styles/makeStyles'

export const Detail = ({metric = {}}) => {
  const {name, totalExceedingDuration = 0, values = [], threshold} = metric
  const data = values.map(v => ({
    id: 'CW ' + DateTime.fromISO(v.date).toFormat('WW'),
    value: Duration.fromISO(v.duration).as('hours')
  }))

  return <Grid container alignContent='flex-start'>
    <Grid item xs={12}>
      <Typography variant='h3'
                  data-testid='heading'
                  align='center'
                  style={{textDecoration: 'underline'}}>{name}</Typography>
    </Grid>

    <Grid item xs={12} style={{height: '460px'}}>
      <ResponsiveBar
        data={data}
        margin={{top: 30, right: 20, bottom: 40, left: 30}}
        colors={{scheme: 'nivo'}}
        borderColor={{from: 'color', modifiers: [['darker', 1.6]]}}
        markers={[
          {
            axis: 'y',
            value: threshold,
            lineStyle: { stroke: 'rgba(0, 0, 0, .35)', strokeWidth: 2 },
          },
        ]}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{from: 'color', modifiers: [['darker', 1.6]]}}
        animate={false}
      />
    </Grid>

    <Grid item xs={12}>
      <Typography variant='subtitle2'
                  align='center'
                  data-testid='total-heading'>{`Total ${name}`}</Typography>
    </Grid>
    <Grid item xs={12}>
      <Typography align='center'
                  data-testid='total-value'>{formatDuration(totalExceedingDuration)}</Typography>
    </Grid>
  </Grid>
}

export default () => {
  const {metricDetail, loadMetricDetail} = useMetrics()
  const {id} = useParams()

  useEffect(() => {
    loadMetricDetail(id)
  }, [id])

  return <Detail metric={metricDetail}/>
}
