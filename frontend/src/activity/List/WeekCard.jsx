import React from 'react'
import Typography from '@material-ui/core/Typography'
import {duration, makeStyles} from '@material-ui/core/styles'
import DayCard from 'activity/List/DayCard'
import Paper from '@material-ui/core/Paper'
import {DateTime} from 'luxon'
import {formatDuration, positiveDurationFrom} from 'functions'
import {useInfiniteScrolling} from 'contexts/IntiniteScrolling'

const useStyles = makeStyles(theme => ({
    weekSummaryCard: {
      marginTop: theme.spacing(),
      marginBottom: theme.spacing(2),
      padding: theme.spacing(2)
    }
  })
)
const WeekCard = ({totalDuration, weekNumber, days, lastElement}) => {
  const classes = useStyles()
  const week = DateTime.fromISO(weekNumber)
  const formattedTotalDuration = formatDuration(totalDuration)
  const firstDay = week.set({weekday: 1}).toFormat('dd.')
  const lastDay = week.set({weekday: 7}).toFormat('dd. MMM, yyyy')
  const {registerLoadingObserver} = useInfiniteScrolling()

  const dayEntries = Object.entries(days)

  let header
  if (lastElement) {
    header = <Paper className={classes.weekSummaryCard}
                    elevation={3}
                    ref={registerLoadingObserver}>
      <Typography variant="h5">
        {formattedTotalDuration} in {`${firstDay} - ${lastDay}`}
      </Typography>
    </Paper>
  } else {
    header = <Paper className={classes.weekSummaryCard} elevation={3}>
      <Typography variant="h5">
        {formattedTotalDuration} in {`${firstDay} - ${lastDay}`}
      </Typography>
    </Paper>
  }
  return <>
    {header}

    {dayEntries
      .sort((a, b) => DateTime.fromISO(b[0]).diff(DateTime.fromISO(a[0])).valueOf())
      .map(([date, day]) => <DayCard key={date}
                                     totalDuration={day.totalDuration}
                                     date={date}
                                     activities={day.activities}/>)}

  </>
}
export default WeekCard
