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
const DayCard = ({totalDurationAsMinutes, date, activities}) => {
  const classes = useStyles()

  return <>
    <Typography variant="subtitle1" className={classes.dayHeadline}>
      {formatMinutesAsHours(totalDurationAsMinutes)} @ {dayjs(date).format('dd DD.')}
    </Typography>

    <List className={classes.list}>
      {
        activities.sort((a, b) => dayjs(b.start).diff(dayjs(a.start)))
          .filter(activity => activity.end !== undefined)
          .map(activity => (
            <ActivityItem {...activity}
                          key={`activity-${activity.id}`}/>
          ))
      }
    </List>
  </>
}

export default DayCard
