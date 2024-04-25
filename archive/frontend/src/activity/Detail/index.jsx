import React, {useEffect, useState} from 'react'
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
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(3)
  },
  buttonContainer: {
    marginTop: theme.spacing(3)
  },
  tagContainer: {
    marginTop: theme.spacing(1)
  },
  spacer: {
    flexGrow: 1
  }
}))

const DeleteConfirmationDialog = ({open, onCancel, onDelete}) => <Dialog
  disableBackdropClick
  disableEscapeKeyDown
  maxWidth="xs"
  aria-labelledby="confirmation-dialog-title"
  open={open}
>
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

const updateInterval = 30000
let timeUpdater

export const Detail = ({
                         start: _start,
                         end: _end,
                         name,
                         tags,
                         stop,
                         back,
                         edit,
                         onDelete,
                         isActivityInProgress,
                         onSwitch,
                         onContinue
                       }) => {
  const classes = useStyles()
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
  const start = DateTime.fromISO(_start, {zone: 'utc'}).toLocal()
  const end = _end && DateTime.fromISO(_end, {zone: 'utc'}).toLocal()
  const [endOrNow, setEndOrNow] = useState(end || DateTime.local())
  const duration = endOrNow.diff(start)

  useEffect(() => {
    if (end) {
      setEndOrNow(end)
      return
    }
    timeUpdater = setInterval(() => {
      setEndOrNow(DateTime.local())
    }, updateInterval)
    return () => {
      if (timeUpdater) {
        clearInterval(timeUpdater)
      }
    }
  }, [_end])

  return <>
    <DeleteConfirmationDialog open={openConfirmDialog}
                              onCancel={() => setOpenConfirmDialog(false)}
                              onDelete={onDelete}/>

    <DetailToolBar onBack={back} onEdit={edit} onDelete={() => setOpenConfirmDialog(true)}/>

    <Grid container className={classes.root}>
      <Grid item xs={12}>
        <Typography data-testid="duration" align="center" variant="h1">
          {formatDuration(duration, {multiline: true})}
        </Typography>
      </Grid>
      <Grid item xs={1}/>
      <Grid item xs={10}>
        <Typography data-testid="name" variant="h5">{name}</Typography>
      </Grid>
      <Grid item xs={1}/>
      <Grid item xs={1}/>
      <Grid item xs={10} className={classes.tagContainer}>
        {tags && tags.sort().map(t => <Chip data-testid={`tag-${t}`} key={t} label={t} size="small"/>)}
      </Grid>
      <Grid item xs={1}/>
      <Grid item xs={1}/>
      <Grid item container xs={11} className={classes.buttonContainer} justifyContent="flex-end">
        <Grid item xs={4}>
          {
            !isActivityInProgress &&
            <Button data-testid="continue-btn"
                    variant="contained"
                    color="primary"
                    onClick={() => onContinue({name, tags})}
            >Continue</Button>
          }
          {
            (isActivityInProgress && end) &&
            <Button data-testid="switch-btn"
                    variant="contained"
                    color="primary"
                    onClick={() => onSwitch({name, tags})}
            >Switch</Button>
          }
          {!end && <Button onClick={() => stop()} color="secondary" variant="contained">Stop</Button>}
        </Grid>
      </Grid>
    </Grid>
  </>
}

export default () => {
  const {id} = useParams()
  const {
    loadActivity,
    activity,
    stopActivity,
    deleteActivity,
    loadRunning,
    running,
    switchActivity,
    continueActivity,
    clearActivity
  } = useActivity()
  const history = useHistory()

  useEffect(() => {
    loadActivity(id)
    loadRunning()
  }, [id])

  return <>
    {
      activity &&
      <Detail {...activity}
              isActivityInProgress={typeof running !== 'undefined'}
              stop={() => stopActivity()
                .then(() => clearActivity())
                .then(() => history.replace('/'))
              }
              back={() => {
                clearActivity()
                history.replace('/')
              }}
              edit={() => {
                clearActivity()
                history.push(`/activities/${id}/edit`)
              }}
              onDelete={() => deleteActivity(id)
                .then(() => clearActivity())
                .then(() => history.replace('/'))
              }
              onSwitch={a => switchActivity(a)
                .then(a => {
                  clearActivity()
                  return a
                })
                .then(a => history.push(`/activities/${a.id}`))
              }
              onContinue={a => continueActivity(a)
                .then(a => {
                  clearActivity()
                  return a
                })
                .then(a => history.push(`/activities/${a.id}`))
              }
      />
    }
  </>
}
