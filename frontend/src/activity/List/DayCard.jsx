import React from 'react'
import Typography from '@material-ui/core/Typography'
import List from '@material-ui/core/List'
import {makeStyles} from '@material-ui/core/styles'
import {extendedDayjs as dayjs, formatMinutesAsHours} from 'extendedDayjs'
import ActivityItem from 'activity/List/ActivityItem'

const useStyles = makeStyles(theme => ({
    dayHeadline: {
      paddingLeft: theme.spacing(2)
    },
    list: {
      paddingTop: 0
    }
  })
)
const DayCard = ({totalDurationAsMinutes, date}) => {
  const classes = useStyles()

  return <>
    <Typography variant="subtitle1" className={classes.dayHeadline}>
      {formatMinutesAsHours(totalDurationAsMinutes)} @ {dayjs(date).format('dd DD.')}
    </Typography>

    <List className={classes.list}>
      {/*iterate over a list of tasks of this day then*/}
      <ActivityItem id={10} name={'This was a task'} start={'2020-03-09T09:00:00Z'} end={'2020-03-09T10:00:00Z'}/>
      <ActivityItem id={10} name={'This was a task'} start={'2020-03-09T09:00:00Z'} end={'2020-03-09T10:00:00Z'}/>
      <ActivityItem id={10} name={'This was a task'} start={'2020-03-09T09:00:00Z'} end={'2020-03-09T10:00:00Z'}/>
      <ActivityItem id={10} name={'This was a task'} start={'2020-03-09T09:00:00Z'} end={'2020-03-09T10:00:00Z'}/>
    </List>
  </>
}

export default DayCard
