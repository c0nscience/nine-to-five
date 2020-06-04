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
import {useHistory} from 'react-router'

const useStyles = makeStyles(theme => {
  return {
    item: {
      paddingTop: 0,
      paddingBottom: 0
    },
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
    },
    time: {
      paddingLeft: theme.spacing(2)
    }
  }
})

export const ActivityItemCard = ({name, tags, duration, since}) => {
  const classes = useStyles()

  return <Card>
    <CardHeader
      data-testid='name'
      title={name}
      subheader={<div className={classes.tagContainer}>
        {tags.map(t => <Chip key={t} data-testid={`tag-${t}`} label={t} size='small'/>)}
      </div>}
      avatar={<Typography variant='h6'
                          data-testid='duration'
                          aria-label="worked duration">
        {formatDuration(duration)}
      </Typography>}/>
  </Card>

}

const ActivityItem = forwardRef(({id, name, start: _start, end: _end, tags = [], hideStartTime = false, hideEndTime = false, now = DateTime.local()}, ref) => {
  const history = useHistory()
  const classes = useStyles()
  const end = _end && DateTime.fromISO(_end, {zone: 'utc'}).toLocal()
  const start = DateTime.fromISO(_start, {zone: 'utc'}).toLocal()
  const endOrNow = end || now
  const duration = endOrNow.diff(start)
  const isInTheFuture = DateTime.local() < start

  return <>
    {!hideStartTime && <ListSubheader data-testid='start-time'
                                      className={classes.time}
                                      disableSticky
                                      disableGutters>
      {start.toFormat('T')}
    </ListSubheader>}
    <ListItem ref={ref}
              className={classes.item}
              disableGutters
              disabled={isInTheFuture}
              button
              onClick={() => history.push(`/activities/${id}`)}
    >
      <ListItemText className={classes.itemText}>
        <ActivityItemCard name={name} duration={duration} tags={tags}/>
      </ListItemText>
    </ListItem>
    {!hideEndTime && <ListSubheader data-testid='end-time'
                                    className={classes.time}
                                    disableSticky
                                    disableGutters>
      {endOrNow.toFormat('T')}
    </ListSubheader>}
  </>
})
export default ActivityItem
