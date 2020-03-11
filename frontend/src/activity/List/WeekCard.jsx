import React from 'react'
import Typography from '@material-ui/core/Typography'
import {makeStyles} from '@material-ui/core/styles'
import {extendedDayjs as dayjs, formatMinutesAsHours} from 'extendedDayjs'
import DayCard from 'activity/List/DayCard'
import Paper from '@material-ui/core/Paper'

const useStyles = makeStyles(theme => ({
    weekSummaryCard: {
      marginTop: theme.spacing(),
      marginBottom: theme.spacing(2),
      padding: theme.spacing(2)
    }
  })
)
const WeekCard = ({totalDurationInMinutes, weekNumber}) => {
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
    {/*iterate over a list of days then right?*/}
    <DayCard totalDurationAsMinutes={125} date={dayjs('2020-03-09')}/>
    <DayCard totalDurationAsMinutes={125} date={dayjs('2020-03-09')}/>
  </>
}

export default WeekCard
