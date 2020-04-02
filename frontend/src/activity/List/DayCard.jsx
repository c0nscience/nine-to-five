import React from 'react'
import Typography from '@material-ui/core/Typography'
import List from '@material-ui/core/List'
import {makeStyles} from '@material-ui/core/styles'
import ActivityItem from 'activity/List/ActivityItem'
import {DateTime} from 'luxon'
import {positiveDurationFrom} from 'functions'
import {useInfiniteScrolling} from 'contexts/IntiniteScrolling'

const useStyles = makeStyles(theme => ({
    dayHeadline: {
      paddingLeft: theme.spacing(2)
    },
    list: {
      paddingTop: 0
    }
  })
)
const DayCard = ({totalDuration, date, activities, lastElement}) => {
  const classes = useStyles()
  const {registerLoadingObserver} = useInfiniteScrolling()
  const formattedDuration = positiveDurationFrom(totalDuration).toFormat('h:mm')

  return <>
    <Typography variant="subtitle1" className={classes.dayHeadline}>
      {formattedDuration} @ {DateTime.fromISO(date).toFormat('dd. MMM, yyyy')}
    </Typography>

    <List className={classes.list}>
      {
        activities
          .sort((a, b) => DateTime.fromISO(b.start).diff(DateTime.fromISO(a.start)).valueOf())
          .filter(activity => activity.end !== undefined)
          .map((activity, index) => {
            if (index + 1 === activities.length && lastElement) {
              return <ActivityItem {...activity}
                                   ref={registerLoadingObserver}
                                   key={`activity-${activity.id}`}/>
            } else {
              return <ActivityItem {...activity}
                                   key={`activity-${activity.id}`}/>
            }
          })
      }
    </List>
  </>
}

export default DayCard
