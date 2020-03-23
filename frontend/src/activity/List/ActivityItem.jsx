import React from 'react'
import Typography from '@material-ui/core/Typography'
import CardContent from '@material-ui/core/CardContent'
import ListItemText from '@material-ui/core/ListItemText'
import ListItem from '@material-ui/core/ListItem'
import Card from '@material-ui/core/Card'
import makeStyles from '@material-ui/core/styles/makeStyles'
import {DateTime} from 'luxon'

const useStyles = makeStyles(theme => ({
  itemText: {
    margin: 0
  },
  content: {
    padding: `${theme.spacing(2)}px !important`
  }
}))

const ActivityItem = ({name, start: _start, end: _end}) => {
  const classes = useStyles()

  const end = _end && DateTime.fromISO(_end, {zone: 'utc'}).toLocal()
  const start = DateTime.fromISO(_start, {zone: 'utc'}).toLocal()
  const isInTheFuture = DateTime.local() < start
  const endOrNow = end || DateTime.local()
  const duration = endOrNow.diff(start)
  const period = ` for ${duration.toFormat('hh:mm')}`

  return <ListItem disableGutters disabled={isInTheFuture}>
    <ListItemText className={classes.itemText}>
      <Card>
        <CardContent className={classes.content}>
          <Typography component='span'>
            {name}
          </Typography>
          <Typography component='span' color='textSecondary' variant='body2'>
            {period}
          </Typography>
        </CardContent>
      </Card>
    </ListItemText>
  </ListItem>
}

export default ActivityItem
