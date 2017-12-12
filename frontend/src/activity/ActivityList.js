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
    const { activities, classes, overtimes } = this.props
    const byDay = activities.reduce((groups, item) => {
      const start = item['start']
      const localStart = moment.utc(start).local().format('ll')
      groups[localStart] = groups[localStart] || []
      groups[localStart].push(item)
      return groups
    }, {})

    const byWeek = Object.keys(byDay)
      .reduce((weeks, date) => {
        const week = moment(date, 'll').format('GGGG-WW')

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
        {Object.entries(byWeek).sort((a, b) => moment(b[0], 'GGGG-WW') - moment(a[0], 'GGGG-WW')).map(v => {
          const [weekNumber, weeks] = v

          const totalWeekDurationAsHours = moment.duration(weeks.totalDuration).asHours().toPrecision(2)
          const currentWeekDate = moment(weekNumber, 'GGGG-WW')
          const overtime = overtimes.find(o => {
            const weekDate = moment(o.week)
            const week = weekDate.isoWeek()
            const year = weekDate.isoWeekYear()

            const currentWeek = currentWeekDate.isoWeek()
            const currentYear = currentWeekDate.isoWeekYear()

            return currentWeek === week && currentYear === year
          })
          console.log(overtime)
          return (
            <div key={weekNumber}>
              <Card className={classes.weekSummaryCard}>
                <CardContent>
                  <Typography type="headline">
                    Worked {totalWeekDurationAsHours} hrs in week {moment(weekNumber, 'GGGG-WW').isoWeek()}
                  </Typography>
                  {
                    overtime && <Typography type="caption">
                      Overtime - Current: {overtime.overtime} - Total: {overtime.totalOvertime}
                    </Typography>
                  }
                </CardContent>
              </Card>

              {Object.entries(weeks.days).filter(value => {
                const activities = value[1]
                return activities.filter(activity => activity.end !== undefined).length > 0
              }).sort((a, b) => moment(b[0], 'll') - moment(a[0], 'll')).map(value => {
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
