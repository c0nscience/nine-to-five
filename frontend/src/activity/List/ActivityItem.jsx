import React, {forwardRef} from 'react'
import ListItemText from '@material-ui/core/ListItemText'
import ListItem from '@material-ui/core/ListItem'
import Card from '@material-ui/core/Card'
import makeStyles from '@material-ui/core/styles/makeStyles'
import {DateTime} from 'luxon'
import {CardHeader} from '@material-ui/core'
import Chip from '@material-ui/core/Chip'
import {formatDuration} from 'functions'
import Typography from '@material-ui/core/Typography'
import ListSubheader from '@material-ui/core/ListSubheader'

const useStyles = makeStyles(theme => {
  return {
    itemText: {
      margin: 0
    },
    tagContainer: {
      display: 'flex',
      justifyContent: 'start',
      flexWrap: 'wrap',
      '& > *': {
        margin: theme.spacing(0.5)
      },
      '& > *:first-child': {
        marginLeft: 0
      }
    }
  }
})

const ActivityItem = forwardRef(({id, name, start: _start, end: _end, tags = [], hideStartTime = false, hideEndTime = false}, ref) => {
  const classes = useStyles()
  const end = _end && DateTime.fromISO(_end, {zone: 'utc'}).toLocal()
  const start = DateTime.fromISO(_start, {zone: 'utc'}).toLocal()
  const isInTheFuture = DateTime.local() < start
  const endOrNow = end || DateTime.local()
  const duration = endOrNow.diff(start)

  const avatar = <Typography variant='h6'
                             aria-label="worked duration">
    {formatDuration(duration)}
  </Typography>

  return <>
    {!hideStartTime && <ListSubheader data-testid='start-time' disableSticky disableGutters>{start.toFormat('T')}</ListSubheader>}
    <ListItem ref={ref} disableGutters disabled={isInTheFuture}>
      <ListItemText className={classes.itemText}>
        <Card>
          <CardHeader title={name}
                      subheader={<div className={classes.tagContainer}>
                        {tags.map(t => <Chip key={t} label={t} size='small'/>)}
                      </div>}
                      avatar={avatar}/>
        </Card>
      </ListItemText>
    </ListItem>
    {!hideEndTime && <ListSubheader data-testid='end-time' disableSticky disableGutters>{endOrNow.toFormat('T')}</ListSubheader>}
  </>
})
export default ActivityItem
