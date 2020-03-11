import React from 'react'
import Typography from '@material-ui/core/Typography'
import {makeStyles} from '@material-ui/core/styles'
import {extendedDayjs as dayjs, formatMinutesAsHours} from 'extendedDayjs'
import DayCard from 'activity/List/DayCard'
import Paper from '@material-ui/core/Paper'
import {Duration} from 'luxon'

const useStyles = makeStyles(theme => ({
    weekSummaryCard: {
      marginTop: theme.spacing(),
      marginBottom: theme.spacing(2),
      padding: theme.spacing(2)
    }
  })
)
const WeekCard = ({totalDurationInMinutes, weekNumber, days}) => {
  const classes = useStyles()
  const week = dayjs().isoWeek(weekNumber)
  const firstDay = week.startOf('isoWeek').format('DD.')
  const lastDay = week.endOf('isoWeek').format('DD. MMM, YYYY')
  return <>
    <Paper className={classes.weekSummaryCard} elevation={3}>
      <Typography variant="h5">
        {formatMinutesAsHours(totalDurationInMinutes)} in {`${firstDay} - ${lastDay}`}
      </Typography>
    </Paper>

    {Object.entries(days)
      // .filter(runningActivities)
      .sort((a, b) => dayjs.utc(b[0]).local().diff(dayjs.utc(a[0]).local()))
      .map(value => {
        const [date, day] = value
        const totalDurationAsMinutes = Duration.fromISO(day.totalDuration).as('minutes')
        return <DayCard key={date}
                        totalDurationAsMinutes={totalDurationAsMinutes}
                        date={date}
                        activities={day.activities}/>
      })}

  </>
}

export default WeekCard
