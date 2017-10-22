import React, { Component } from 'react'
import { connect } from 'react-redux'
import ActivityItem from './ActivityItem'
import { loadActivities } from '../reducers/activity'
import { withStyles } from 'material-ui/styles'
import List from 'material-ui/List'
import moment from 'moment'
import { Card, CardContent, Typography } from 'material-ui'

const styles = theme => ({
  weekSummaryCard: theme.mixins.gutters({
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit * 2,
  }),
  card: theme.mixins.gutters({
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  }),
  dayHeadline: {
    paddingLeft: theme.spacing.unit * 2
  }
})

class ActivityList extends Component {

  componentDidMount() {
    this.props.loadActivities()
  }

  render() {
    const { activities, classes } = this.props
    const byDay = activities.reduce((groups, item) => {
      const start = item['start']
      const localStart = moment.utc(start).local().format('ll')
      groups[localStart] = groups[localStart] || []
      groups[localStart].push(item)
      return groups
    }, {})

    const byWeek = Object.keys(byDay)
      .reduce((weeks, date) => {
        const week = moment(date, 'll').week()

        weeks[week] = weeks[week] || {
          totalDuration: 0,
          days: {}
        }
        const activities = byDay[date]
        weeks[week].days = {
          [date]: activities,
          ...weeks[week].days
        }

        weeks[week].totalDuration += activities.reduce((result, activity) => {
          const localStart = moment.utc(activity.start).local()
          const localEnd = moment.utc(activity.end).local()

          const diff = moment(localEnd).diff(moment(localStart))
          return result + diff
        }, 0)

        return weeks
      }, {})

    return (
      <div>
        {Object.entries(byWeek).map(v => {
          const [weekNumber, weeks] = v

          const totalWeekDurationAsHours = moment.duration(weeks.totalDuration).asHours().toPrecision(2)
          return (
            <div key={weekNumber}>
              <Card className={classes.weekSummaryCard}>
                <CardContent>
                  <Typography type="display1">
                    Worked {totalWeekDurationAsHours} hrs in week {weekNumber}
                  </Typography>
                </CardContent>
              </Card>

              {Object.entries(weeks.days).map(value => {
                const [day, activities] = value
                const totalDiff = activities.reduce((result, activity) => {
                  const localStart = moment.utc(activity.start).local()
                  const localEnd = moment.utc(activity.end).local()

                  const diff = moment(localEnd).diff(moment(localStart))
                  return result + diff
                }, 0)

                const totalDurationAsHours = moment.duration(totalDiff).asHours().toPrecision(2)
                return (
                  <div key={day}>
                    <Typography type="subheading" className={classes.dayHeadline}>
                      {totalDurationAsHours} hrs on {day}
                    </Typography>
                    <Card className={classes.card}>
                      <CardContent>
                        <List>
                          {activities.map(activity => (
                            <div key={activity.id}>
                              <ActivityItem {...activity}
                                            isRunning={activity.end === undefined}/>
                            </div>
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
  activities: state.activity.activities
})
export default connect(
  mapStateToProps,
  {
    loadActivities
  }
)(withStyles(styles)(ActivityList))
