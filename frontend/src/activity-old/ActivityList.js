import React, {useEffect} from 'react'
import {connect} from 'react-redux'
import ActivityItem from './ActivityItem'
import {loadActivities, loadOvertime, loadRunningActivity} from '../actions'
import {withStyles} from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import {DateTime, Duration} from 'luxon'

const styles = theme => ({
  weekSummaryCard: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit * 2,
  },
  card: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  dayHeadline: {
    paddingLeft: theme.spacing.unit * 2
  },
  cardContent: {
    padding: 0
  }
})

const WeekSummary = ({weekNumber, totalHours}) =>
  <Typography variant="h5">
    Worked {totalHours} hrs in week {DateTime.fromISO(weekNumber).toFormat('W')}
  </Typography>

const OverTimeStatisticBlock = ({overtimeStatistics}) =>
  <Typography variant="caption">
    Overtime - Current: {Duration.fromISO(overtimeStatistics.overtime).as('hours').toFixed(1)} -
    Total: {Duration.fromISO(overtimeStatistics.totalOvertime).as('hours').toFixed(1)}
  </Typography>

const DaySummary = withStyles(styles)(({totalHours, date, classes}) =>
  <Typography variant="subtitle1"
              className={classes.dayHeadline}>
    {totalHours} hrs on {DateTime.fromISO(date, {zone: 'utc'}).toLocal().toFormat('DD')}
  </Typography>)

const Day = withStyles(styles)(({date, totalDuration, classes, children}) =>
  <React.Fragment>
    <DaySummary totalHours={totalDuration} date={date}/>
    <Card className={classes.card}>
      <CardContent className={classes.cardContent}>
        <List>
          {children}
        </List>
      </CardContent>
    </Card>
  </React.Fragment>)


const Week = withStyles(styles)(({weekNumber, weeks, classes, overtimeStatistics, children}) => {
  const totalWeekDurationAsHours = Duration.fromISO(weeks.totalDuration).as('hours').toFixed(1)

  return <React.Fragment>
    <Card className={classes.weekSummaryCard}>
      <CardContent>
        <WeekSummary weekNumber={weekNumber} totalHours={totalWeekDurationAsHours}/>
        {
          overtimeStatistics && <OverTimeStatisticBlock overtimeStatistics={overtimeStatistics}/>
        }
      </CardContent>
    </Card>

    {children}
  </React.Fragment>
})

const ActivityList = ({activitiesByWeek: byWeek, overtimes, loadActivities, loadOvertime, loadRunningActivity}) => {
  useEffect(() => {
    loadActivities()
    loadOvertime()
    loadRunningActivity()
  }, [loadActivities, loadOvertime, loadRunningActivity])

  return <React.Fragment>
    {Object.entries(byWeek)
      .sort((a, b) => DateTime.fromISO(b[0]).toSeconds() - DateTime.fromISO(a[0]).toSeconds())
      .map(v => {
        const [weekNumber, weeks] = v

        const currentWeekDate = DateTime.fromISO(weekNumber)
        const overtimeStatistics = overtimes.find(o => {
          const weekDate = DateTime.fromISO(o.week)
          const week = weekDate.weekNumber
          const year = weekDate.weekYear

          const currentWeek = currentWeekDate.weekNumber
          const currentYear = currentWeekDate.weekYear

          return currentWeek === week && currentYear === year
        })
        return (
          <Week key={weekNumber} weekNumber={weekNumber} weeks={weeks} overtimeStatistics={overtimeStatistics}>
            {Object.entries(weeks.days)
              .filter(value => {
                const activities = value[1].activities
                return activities.filter(activity => activity.end !== undefined).length > 0
              })
              .sort((a, b) => DateTime.fromISO(b[0], {zone: 'utc'}).toLocal().toSeconds() - DateTime.fromISO(a[0], {zone: 'utc'}).toLocal().toSeconds())
              .map(value => {
                const [dayDate, day] = value
                const activities = day.activities
                const totalDurationAsHours = Duration.fromISO(day.totalDuration).as('hours').toFixed(1)
                return (
                  <Day key={dayDate} date={dayDate} activities={activities} totalDuration={totalDurationAsHours}>
                    {
                      activities.sort((a, b) => DateTime.fromISO(b.start).toSeconds() - DateTime.fromISO(a.start).toSeconds())
                        .filter(activity => activity.end !== undefined)
                        .map(activity => (
                          <ActivityItem key={`activity-${activity.id}`}
                                        {...activity}/>
                        ))
                    }
                  </Day>
                )
              })}
          </Week>
        )
      })}
  </React.Fragment>
}

const mapStateToProps = state => ({
  activitiesByWeek: state.activity.activitiesByWeek,
  overtimes: state.activity.overtimes
})

const mapDispatchToProps = {
  loadActivities,
  loadOvertime,
  loadRunningActivity
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActivityList)
