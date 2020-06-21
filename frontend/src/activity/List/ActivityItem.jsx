import React, {forwardRef} from 'react'
import ListItemText from '@material-ui/core/ListItemText'
import ListItem from '@material-ui/core/ListItem'
import Card from '@material-ui/core/Card'
import makeStyles from '@material-ui/core/styles/makeStyles'
import {DateTime,Settings} from 'luxon'
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
      data-testid='name'
      title={name}
      subheader={<div className={classes.tagContainer}>
        {tags.sort().map(t => <Chip key={t} data-testid={`tag-${t}`} label={t} size='small'/>)}
      </div>}
      avatar={
        <>
          <Typography variant='h6'
                      data-testid='duration'
                      aria-label="worked duration">
            {formatDuration(duration)}
          </Typography>
          {
            since &&
            <Typography variant='caption'
                        data-testid='since'
                        aria-label='worked since'>
              since {since}
            </Typography>
          }
        </>
      }/>
  </Card>

}

//TODO dirty hack for the time beeing
Settings.defaultZoneName = 'Europe/Berlin'

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
