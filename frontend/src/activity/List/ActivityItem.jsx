import React, {forwardRef, useState} from 'react'
import ListItemText from '@material-ui/core/ListItemText'
import ListItem from '@material-ui/core/ListItem'
import Card from '@material-ui/core/Card'
import makeStyles from '@material-ui/core/styles/makeStyles'
import {DateTime, Settings} from 'luxon'
import {Button, CardHeader, Grid, Popover} from '@material-ui/core'
import Chip from '@material-ui/core/Chip'
import {formatDuration} from 'functions'
import Typography from '@material-ui/core/Typography'
import ListSubheader from '@material-ui/core/ListSubheader'
import Link from '@material-ui/core/Link'
import {useHistory} from 'react-router'
import {MuiPickersUtilsProvider, TimePicker} from '@material-ui/pickers'
import LuxonUtils from '@date-io/luxon'
import {useActivity} from 'contexts/ActivityContext'

const useStyles = makeStyles(theme => {
  return {
    item: {
      paddingTop: 0,
      paddingBottom: 0
    },
    itemText: {
      margin: 0
    },
    cardHeaderContent: {
      overflow: 'hidden',
      flex: '1 1 auto'
    },
    cardHeaderTitle: {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis'
    },
    tagContainer: {
      display: 'flex',
      justifyContent: 'start',
      '& > *': {
        margin: theme.spacing(0.5)
      },
      '& > *:first-child': {
        marginLeft: 0
      }
    },
    time: {
      paddingLeft: theme.spacing(2)
    },
    pickerControls: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
      paddingBottom: theme.spacing(1)
    }
  }
})

export const ActivityItemCard = ({name, tags, duration, since, raised = false, square = false, cardClass}) => {
  const classes = useStyles()

  return <Card raised={raised}
               square={square}
               className={cardClass}>
    <CardHeader
      classes={{
        content: classes.cardHeaderContent,
        title: classes.cardHeaderTitle
      }}
      data-testid="name"
      title={name}
      subheader={<div className={classes.tagContainer}>
        {tags && tags.sort().map(t => <Chip key={t} data-testid={`tag-${t}`} label={t} size="small"/>)}
      </div>}
      avatar={
        <>
          <Typography variant="h6"
                      data-testid="duration"
                      aria-label="worked duration">
            {formatDuration(duration)}
          </Typography>
          {
            since &&
            <Typography variant="caption"
                        data-testid="since"
                        aria-label="worked since">
              since {since}
            </Typography>
          }
        </>
      }/>
  </Card>

}

//TODO dirty hack for the time being
Settings.defaultZoneName = 'Europe/Berlin'

export const ActivityItem = forwardRef(({
                                   id,
                                   name,
                                   start: _start,
                                   end: _end,
                                   tags = [],
                                   prevActivity = null,
                                   running = null,
                                   hideStartTime = false,
                                   hideEndTime = false,
                                   reload = () => {},
                                   saveActivity = () => {},
                                   now = DateTime.local()
                                 }, ref) => {
  const history = useHistory()
  const classes = useStyles()
  const end = _end && DateTime.fromISO(_end, {zone: 'utc'}).toLocal()
  const start = DateTime.fromISO(_start, {zone: 'utc'}).toLocal()
  const endOrNow = end || now
  const duration = endOrNow.diff(start)

  const [currentDate, setCurrentDate] = useState(null)
  const [editEnd, setEditEnd] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handlePopoverClose = () => {
    setAnchorEl(null)
  }
  const open = Boolean(anchorEl)
  return <>
    {!hideStartTime && <ListSubheader data-testid="start-time"
                                      className={classes.time}
                                      disableSticky
                                      disableGutters>
      <Link component="button"
            onClick={event => {
              setCurrentDate(start)
              setEditEnd(false)
              handlePopoverOpen(event)
            }}>{start.toFormat('T')}</Link>
    </ListSubheader>}
    <ListItem ref={ref}
              className={classes.item}
              disableGutters
              button
              onClick={() => history.push(`/activities/${id}`)}
    >
      <ListItemText className={classes.itemText}>
        <ActivityItemCard name={name} duration={duration} tags={tags}/>
      </ListItemText>
    </ListItem>
    {!hideEndTime && <ListSubheader data-testid="end-time"
                                    className={classes.time}
                                    disableSticky
                                    disableGutters>
      <Link component="button" onClick={event => {
        setCurrentDate(endOrNow)
        setEditEnd(true)
        handlePopoverOpen(event)
      }}>{endOrNow.toFormat('T')}</Link>
    </ListSubheader>}
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handlePopoverClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
    >
      <div data-testid="date-picker">
        <MuiPickersUtilsProvider utils={LuxonUtils}>
          <TimePicker
            variant="static"
            openTo="hours"
            value={currentDate}
            minutesStep={5}
            ampm={false}
            onChange={d => {
              setCurrentDate(d)
            }}
          />
        </MuiPickersUtilsProvider>
      </div>
      <Grid container justifyContent="space-between" className={classes.pickerControls}>
        <Grid item>
          <Button onClick={handlePopoverClose}
                  color="secondary"
                  variant="contained">
            Cancel
          </Button>
        </Grid>
        <Grid item>
          <Button onClick={() => {
            let activity = {
              id: id,
              name: name,
              start: currentDate.toUTC().toISO(),
              end: _end && DateTime.fromISO(_end).toUTC().toISO(),
              tags: tags
            }

            if (editEnd) {
              activity = {
                id: id,
                name: name,
                start: DateTime.fromISO(_start).toUTC().toISO(),
                end: currentDate.toUTC().toISO(),
                tags: tags
              }
            }

            let promises = [saveActivity(activity)]
            if (Boolean(prevActivity) && !editEnd) {
              console.log("prev act set")
              promises.push(saveActivity({
                id: prevActivity.id,
                name: prevActivity.name,
                start: DateTime.fromISO(prevActivity.start).toUTC().toISO(),
                end: currentDate.toUTC().toISO(),
                tags: prevActivity.tags
              }))
            }
            if (Boolean(running) && running.start === _end) {
              promises.push(saveActivity({
                id: running.id,
                name: running.name,
                start: currentDate.toUTC().toISO(),
                tags: running.tags
              }))
            }
            Promise.all(promises).then(() => reload())
          }}
                  color="primary"
                  variant="contained">
            Save
          </Button>
        </Grid>
      </Grid>
    </Popover>
  </>
})
export default (props) => {
  const {saveActivity, running} = useActivity()

  return <ActivityItem {...props} saveActivity={saveActivity} running={running}/>
}
