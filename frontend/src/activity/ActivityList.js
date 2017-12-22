import React, { Component } from 'react'
import { connect } from 'react-redux'
import ActivityItem from './ActivityItem'
import { loadActivities, loadOvertime } from '../actions'
import { withStyles } from 'material-ui/styles'
import List from 'material-ui/List'
import moment from 'moment'
import { Card, CardContent, Typography } from 'material-ui'

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

class ActivityList extends Component {

  componentDidMount() {
    this.props.loadActivities()
    this.props.loadOvertime()
  }

  render() {
    const { activities: byWeek, classes, overtimes } = this.props
    return (
      <div>
        {Object.entries(byWeek).sort((a, b) => moment(b[0], 'GGGG-WW') - moment(a[0], 'GGGG-WW')).map(v => {
          const [weekNumber, weeks] = v

          const totalWeekDurationAsHours = moment.duration(weeks.totalDuration).asHours().toPrecision(3)
          const currentWeekDate = moment(weekNumber, 'GGGG-WW')
          const overtimeStatistics = overtimes.find(o => {
            const weekDate = moment(o.week)
            const week = weekDate.isoWeek()
            const year = weekDate.isoWeekYear()

            const currentWeek = currentWeekDate.isoWeek()
            const currentYear = currentWeekDate.isoWeekYear()

            return currentWeek === week && currentYear === year
          })
          return (
            <div key={weekNumber}>
              <Card className={classes.weekSummaryCard}>
                <CardContent>
                  <Typography type="headline">
                    Worked {totalWeekDurationAsHours} hrs in week {moment(weekNumber, 'GGGG-WW').isoWeek()}
                  </Typography>
                  {
                    overtimeStatistics && <Typography type="caption">
                      Overtime - Current: {moment.duration(overtimeStatistics.overtime).asHours().toPrecision(3)} - Total: {moment.duration(overtimeStatistics.totalOvertime).asHours().toPrecision(3)}
                    </Typography>
                  }
                </CardContent>
              </Card>

              {Object.entries(weeks.days).filter(value => {
                const activities = value[1].activities
                return activities.filter(activity => activity.end !== undefined).length > 0
              }).sort((a, b) => moment(b[0], 'll') - moment(a[0], 'll')).map(value => {
                const [dayDate, day] = value
                const activities = day.activities
                const totalDurationAsHours = moment.duration(day.totalDuration).asHours().toPrecision(2)
                return (
                  <div key={dayDate}>
                    <Typography type="subheading" className={classes.dayHeadline}>
                      {totalDurationAsHours} hrs on {dayDate}
                    </Typography>
                    <Card className={classes.card}>
                      <CardContent className={classes.cardContent}>
                        <List>
                          {activities.filter(activity => activity.end !== undefined).map(activity => (
                            <ActivityItem {...activity}
                                          key={activity.id}/>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }
}

const mapStateToProps = state => ({
  activities: state.activity.activities,
  overtimes: state.activity.overtimes
})
export default connect(
  mapStateToProps,
  {
    loadActivities,
    loadOvertime
  }
)(withStyles(styles)(ActivityList))
