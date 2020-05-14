import React, {useEffect} from 'react'
import Typography from '@material-ui/core/Typography'
import {formatDuration} from 'functions'
import {useMetrics} from 'contexts/MetricsContext'
import {useParams} from 'react-router'
import Grid from '@material-ui/core/Grid'
import {ResponsiveBar} from '@nivo/bar'
import {DateTime, Duration} from 'luxon'

export const Detail = ({metric = {name: '', totalExceedingDuration: '', values: []}}) => {
  const {name, totalExceedingDuration, values, threshold} = metric
  const data = values.map(v => ({
    id: 'CW ' + DateTime.fromISO(v.date).toFormat('WW'),
    value: Duration.fromISO(v.duration).as('hours')
  }))

  return <Grid container>
    <Grid item xs={12}>
      <Typography variant='h3'
                  data-testid='heading'
                  align='center'
                  style={{textDecoration: 'underline'}}>{name}</Typography>
    </Grid>

    <Grid item xs={12} style={{height: '400px'}}>
      <ResponsiveBar
        data={data}
        margin={{top: 50, right: 130, bottom: 50, left: 60}}
        padding={0.3}
        colors={{scheme: 'nivo'}}
        borderColor={{from: 'color', modifiers: [['darker', 1.6]]}}
        axisTop={null}
        axisRight={null}
        markers={[
          {
            axis: 'y',
            value: threshold,
            lineStyle: { stroke: 'rgba(0, 0, 0, .35)', strokeWidth: 2 },
          },
        ]}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Week',
          legendPosition: 'middle',
          legendOffset: 32
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: name,
          legendPosition: 'middle',
          legendOffset: -40
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{from: 'color', modifiers: [['darker', 1.6]]}}
        animate={true}
        motionStiffness={90}
        motionDamping={15}
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
