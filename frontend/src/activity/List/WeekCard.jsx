import React from 'react'
import Typography from '@material-ui/core/Typography'
import {makeStyles} from '@material-ui/core/styles'
import DayCard from 'activity/List/DayCard'
import Paper from '@material-ui/core/Paper'
import {DateTime, Duration} from 'luxon'

const useStyles = makeStyles(theme => ({
    weekSummaryCard: {
      marginTop: theme.spacing(),
      marginBottom: theme.spacing(2),
      padding: theme.spacing(2)
    }
  })
)
const WeekCard = ({totalDuration, weekNumber, days}) => {
  const classes = useStyles()
  const week = DateTime.fromISO(weekNumber)
  const formattedTotalDuration = Duration.fromISO(totalDuration).toFormat('hh:mm')
  const firstDay = week.set({weekday: 1}).toFormat('dd.')
  const lastDay = week.set({weekday: 7}).toFormat('dd. MMM, yyyy')

  return <>
    <Paper className={classes.weekSummaryCard} elevation={3}>
      <Typography variant="h5">
        {formattedTotalDuration} in {`${firstDay} - ${lastDay}`}
      </Typography>
    </Paper>

    {Object.entries(days)
      .sort((a, b) => DateTime.fromISO(b[0]).diff(DateTime.fromISO(a[0])).valueOf())
      .map(value => {
        const [date, day] = value
        return <DayCard key={date}
                        totalDuration={day.totalDuration}
                        date={date}
                        activities={day.activities}/>
      })}

  </>
}

export default WeekCard
