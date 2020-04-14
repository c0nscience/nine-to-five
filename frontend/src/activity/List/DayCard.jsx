import React from 'react'
import Typography from '@material-ui/core/Typography'
import List from '@material-ui/core/List'
import {makeStyles} from '@material-ui/core/styles'
import ActivityItem from 'activity/List/ActivityItem'
import {DateTime} from 'luxon'
import {formatDuration, positiveDurationFrom} from 'functions'

const useStyles = makeStyles(theme => ({
    dayHeadline: {
      paddingLeft: theme.spacing(2)
    },
    list: {
      paddingTop: 0
    }
  })
)
const DayCard = ({totalDuration, date, activities}) => {
  const classes = useStyles()
  // const formattedDuration = formatDuration(totalDuration)

  return <>
    <Typography variant="subtitle1" className={classes.dayHeadline}>
      {/*{formattedDuration} @ */}{DateTime.fromISO(date).toFormat('dd. MMM, yyyy')}
    </Typography>

    <List className={classes.list}>
      {
        activities
          .sort((a, b) => DateTime.fromISO(b.start).diff(DateTime.fromISO(a.start)).valueOf())
          .filter(activity => activity.end !== undefined)
          .map(activity => <ActivityItem {...activity}
                                         key={`activity-${activity.id}`}/>)
      }
    </List>
  </>
}

export default DayCard
