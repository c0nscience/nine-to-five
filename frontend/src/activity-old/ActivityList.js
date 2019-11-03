import React, { Component } from 'react'
import { connect } from 'react-redux'
import ActivityItem from './ActivityItem'
import moment from 'moment'
import {loadActivities, loadOvertime, loadRunningActivity, startUpdating} from '../actions'
import { withStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  weekSummaryCard: {
    marginTop: theme.spacing(),
    marginBottom: theme.spacing(2),
  },
  card: {
    marginTop: theme.spacing(),
    marginBottom: theme.spacing(),
  },
  dayHeadline: {
    paddingLeft: theme.spacing(2)
  },
  cardContent: {
    padding: 0
  }
})

const OvertimeStatistics = ({overtimeStatistics}) => <Typography variant="caption">
  Overtime - Current: {moment.duration(overtimeStatistics.overtime).asHours().toPrecision(3)} -
  Total: {moment.duration(overtimeStatistics.totalOvertime).asHours().toPrecision(3)}
</Typography>

const runningActivities = value => {
  const activities = value[1].activities
  return activities.filter(activity => activity.end !== undefined).length > 0
}

const DayCard = withStyles(styles)(({totalDurationAsHours, dayDate, activities, classes}) => <React.Fragment>
  <Typography variant="subtitle1" className={classes.dayHeadline}>
    {totalDurationAsHours} hrs on {moment.utc(dayDate).local().format('ll')}
  </Typography>
  <Card className={classes.card}>
    <CardContent className={classes.cardContent}>
      <List>
        {
          activities.sort((a, b) => moment(b.start) - moment(a.start))
            .filter(activity => activity.end !== undefined)
            .map(activity => (
              <ActivityItem {...activity}
                            key={`activity-${activity.id}`}/>
            ))
        }
      </List>
    </CardContent>
  </Card>
</React.Fragment>)

const weekDateFormat = 'GGGG-W'

const WeekCard = withStyles(styles)(({totalWeekDurationAsHours, weekNumber, overtimeStatistics, classes, weeks}) => <React.Fragment>
  <Card className={classes.weekSummaryCard}>
    <CardContent>
      <Typography variant="h5">
        Worked {totalWeekDurationAsHours} hrs in week {moment(weekNumber, weekDateFormat).isoWeek()}
      </Typography>
      {
        overtimeStatistics && <OvertimeStatistics overtimeStatistics={overtimeStatistics}/>
      }
    </CardContent>
  </Card>

  {Object.entries(weeks.days)
    .filter(runningActivities)
    .sort((a, b) => moment.utc(b[0]).local() - moment.utc(a[0]).local())
    .map(value => {
      const [dayDate, day] = value
      const activities = day.activities
      const totalDurationAsHours = moment.duration(day.totalDuration).asHours().toPrecision(2)
      return <DayCard key={dayDate} totalDurationAsHours={totalDurationAsHours} dayDate={dayDate} activities={activities}/>
    })}
</React.Fragment>)

class ActivityList extends Component {

  componentDidMount() {
    this.props.loadActivities()
    this.props.loadOvertime()
    this.props.loadRunningActivity()
    this.props.startUpdating()
  }

  render() {
    const { activitiesByWeek: byWeek, overtimes } = this.props
    return <React.Fragment>
      {Object.entries(byWeek)
        .sort((a, b) => moment(b[0], weekDateFormat) - moment(a[0], weekDateFormat))
        .map(v => {
          const [weekNumber, weeks] = v

          const totalWeekDurationAsHours = moment.duration(weeks.totalDuration).asHours().toPrecision(3)
          const currentWeekDate = moment(weekNumber, weekDateFormat)
          const overtimeStatistics = overtimes.find(o => {
            const weekDate = moment(o.week)
            const week = weekDate.isoWeek()
            const year = weekDate.isoWeekYear()

            const currentWeek = currentWeekDate.isoWeek()
            const currentYear = currentWeekDate.isoWeekYear()

            return currentWeek === week && currentYear === year
          })
          return <WeekCard key={weekNumber}
                           totalWeekDurationAsHours={totalWeekDurationAsHours}
                           weekNumber={weekNumber}
                           overtimeStatistics={overtimeStatistics}
                           weeks={weeks}/>
        })}
    </React.Fragment>
  }
}

const mapStateToProps = state => ({
  activitiesByWeek: state.activity.activitiesByWeek,
  overtimes: state.activity.overtimes
})
export default connect(
  mapStateToProps,
  {
    loadActivities,
    loadOvertime,
    loadRunningActivity,
    startUpdating
  }
)(ActivityList)
