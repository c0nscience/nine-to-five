import React from 'react'
import {extendedDayjs as dayjs, formatMinutesAsHours} from 'extendedDayjs'
import Typography from '@material-ui/core/Typography'
import CardContent from '@material-ui/core/CardContent'
import ListItemText from '@material-ui/core/ListItemText'
import ListItem from '@material-ui/core/ListItem'
import Card from '@material-ui/core/Card'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles(theme => ({
  itemText: {
    margin: 0
  },
  content: {
    padding: `${theme.spacing(2)}px !important`
  }
}))

const ActivityItem = ({id, name, start: _start, end: _end, isRunningActivity}) => {
  const classes = useStyles()

  const end = _end && dayjs.utc(_end).local()
  const start = dayjs.utc(_start).local()
  const isInTheFuture = dayjs().isBefore(start)
  const endOrNow = end || dayjs()
  const duration = endOrNow.diff(start, 'minute')
  const period = ` for ${formatMinutesAsHours(duration)}`

  return <ListItem disableGutters>
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
