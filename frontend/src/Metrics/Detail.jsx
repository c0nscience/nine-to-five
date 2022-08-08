import React, {useEffect, useState} from 'react'
import Typography from '@material-ui/core/Typography'
import {formatDuration} from 'functions'
import {useMetrics} from 'contexts/MetricsContext'
import {useHistory, useParams} from 'react-router'
import Grid from '@material-ui/core/Grid'
import {ResponsiveBar} from '@nivo/bar'
import {DateTime, Duration} from 'luxon'
import {DetailToolBar} from 'component/DetailToolbar'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'

const DeleteConfirmationDialog = ({open, onCancel, onDelete}) =>
  <Dialog
    disableEscapeKeyDown
    maxWidth="xs"
    aria-labelledby="confirmation-dialog-title"
    open={open}>
    <DialogTitle id="confirmation-dialog-title">Delete Activity</DialogTitle>
    <DialogContent dividers>
      <Typography>Do you really want to delete this activity?</Typography>
    </DialogContent>
    <DialogActions>
      <Button autoFocus onClick={onCancel} color="primary">
        No
      </Button>
      <Button onClick={onDelete} color="secondary">
        Yes
      </Button>
    </DialogActions>
  </Dialog>

export const Detail = ({metric = {}, deleteMetric, editMetric, back}) => {
  const {name, totalExceedingDuration = 0, threshold = 0, currentExceedingDuration = 0} = metric
  let {values = []} = metric
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  if (values.length > 6) {
    values = values.slice(values.length - 6)
  }

  const data = values.map(v => {
    let dur
    if (typeof v.duration === 'number') {
      dur = Duration.fromMillis(v.duration / 1e6)
    }
    if (typeof v.duration === 'string') {
      dur = Duration.fromISO(v.duration)
    }

    console.log('duration', v.duration)
    console.log('duration type', typeof v.duration)

    return {
      id: 'CW ' + DateTime.fromISO(v.date).toFormat('WW'),
      value: dur.as('hours'),
      duration: dur
    }
  })

  const markers = []
  if (threshold > 0) {
    markers.push({
        axis: 'y',
        value: threshold,
        lineStyle: {stroke: 'rgba(0, 0, 0, .35)', strokeWidth: 2}
      })
  }
  return <>
    <DeleteConfirmationDialog open={confirmDialogOpen}
                              onCancel={() => setConfirmDialogOpen(false)}
                              onDelete={deleteMetric}/>

    <DetailToolBar onBack={back}
                   onEdit={editMetric}
                   onDelete={() => setConfirmDialogOpen(true)}/>

    <Grid container alignContent="flex-start">

      <Grid item xs={12}>
        <Typography variant="h5"
                    data-testid="heading"
                    align="center"
                    style={{textDecoration: 'underline'}}>{name}</Typography>
      </Grid>

      <Grid item xs={12} style={{height: '430px'}}>
        <ResponsiveBar
          data={data}
          margin={{top: 30, right: 20, bottom: 40, left: 30}}
          colors={{scheme: 'nivo'}}
          borderColor={{from: 'color', modifiers: [['darker', 1.6]]}}
          markers={markers}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{from: 'color', modifiers: [['darker', 1.6]]}}
          label={d => formatDuration(d.data.duration)}
          animate={false}
          isInteractive={false}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2"
                    align="center"
                    data-testid="total-heading">{`Exceeding ${name}`}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography align="center"
                    data-testid="total-value">{formatDuration(totalExceedingDuration)}</Typography>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2"
                    align="center"
                    data-testid="current-heading">{`Current Exceeding ${name}`}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography align="center"
                    data-testid="current-value">{formatDuration(currentExceedingDuration)}</Typography>
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
