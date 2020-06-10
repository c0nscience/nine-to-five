import React, {useEffect} from 'react'
import Typography from '@material-ui/core/Typography'
import {formatDuration} from 'functions'
import Chip from '@material-ui/core/Chip'
import Button from '@material-ui/core/Button'
import {useHistory, useParams} from 'react-router'
import {useActivity} from 'contexts/ActivityContext'
import {DateTime} from 'luxon'
import makeStyles from '@material-ui/core/styles/makeStyles'
import Grid from '@material-ui/core/Grid'
import {DetailToolBar} from 'component/DetailToolbar'

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(3)
  },
  spacer: {
    flexGrow: 1
  }
}))

export const Detail = ({start: _start, end: _end, name, tags, stop, back, edit, onDelete}) => {
  const classes = useStyles()
  const start = DateTime.fromISO(_start, {zone: 'utc'}).toLocal()
  const end = _end && DateTime.fromISO(_end, {zone: 'utc'}).toLocal()
  const endOrNow = end || DateTime.local()
  const duration = endOrNow.diff(start)

  return <>
    <DetailToolBar onBack={back} onEdit={edit} onDelete={onDelete}/>

    <Grid container className={classes.root}>
      <Grid item xs={12}>
        <Typography data-testid='duration' align='center' variant='h1'>
          {formatDuration(duration, {multiline: true})}
        </Typography>
      </Grid>
      <Grid item xs={1}/>
      <Grid item xs={10}>
        <Typography data-testid='name' variant='h5'>{name}</Typography>
      </Grid>
      <Grid item xs={1}/>
      <Grid item xs={1}/>
      <Grid item xs={10}>
        {tags && tags.map(t => <Chip data-testid={`tag-${t}`} key={t} label={t} size='small'/>)}
      </Grid>
      <Grid item xs={1}/>
      <Grid item xs={12}>
        {!end && <Button onClick={() => stop()} color='secondary'>Stop</Button>}
      </Grid>
    </Grid>
  </>
}

export default () => {
  const {id} = useParams()
  const {loadActivity, activity, stopActivity, deleteActivity} = useActivity()
  const history = useHistory()

  useEffect(() => {
    loadActivity(id)
  }, [id])

  return <Detail {...activity}
                 stop={() => stopActivity()
                   .then(() => history.replace('/'))
                 }
                 back={() => history.replace('/')}
                 edit={() => history.push(`/activities/${id}/edit`)}
                 onDelete={() => deleteActivity(id)
                   .then(() => history.replace('/'))
                 }/>
}
