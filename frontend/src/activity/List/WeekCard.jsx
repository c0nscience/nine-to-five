import React from 'react'
import Typography from '@material-ui/core/Typography'
import {makeStyles} from '@material-ui/core/styles'
import DayCard from 'activity/List/DayCard'
import Paper from '@material-ui/core/Paper'
import {DateTime} from 'luxon'
import {positiveDurationFrom} from 'functions'

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
  const formattedTotalDuration = positiveDurationFrom(totalDuration).toFormat('hh:mm')
  const firstDay = week.set({weekday: 1}).toFormat('dd.')
  const lastDay = week.set({weekday: 7}).toFormat('dd. MMM, yyyy')

  const dayEntries = Object.entries(days)
  return <>
    <Paper className={classes.weekSummaryCard} elevation={3}>
      <Typography variant="h5">
        {formattedTotalDuration} in {`${firstDay} - ${lastDay}`}
      </Typography>
    </Paper>

    {dayEntries
      .sort((a, b) => DateTime.fromISO(b[0]).diff(DateTime.fromISO(a[0])).valueOf())
      .map((value, index) => {
        const [date, day] = value
        return <DayCard key={date}
                        lastElement={index + 1 === dayEntries.length && lastElement}
                        totalDuration={day.totalDuration}
                        date={date}
                        activities={day.activities}/>
      })}

  </>
}

export default WeekCard
