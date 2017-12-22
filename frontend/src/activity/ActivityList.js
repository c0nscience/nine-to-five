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

let run = 0

class ActivityList extends Component {

  componentDidMount() {
    this.props.loadActivities()
    this.props.loadOvertime()
  }

  render() {
    console.time(`#${run} Render list`)
    const { activities, classes, overtimes } = this.props
    console.time(`#${run} Render list - reduce`)
    console.log(`#${run} Render list - number of activities ${activities.length}`)
    const byWeek = activities.reduce((weeks, activity) => {
      const weekDate = activity.start.format('GGGG-WW')
      const dayDate = activity.start.format('ll')
      const week = weeks[weekDate] || {
        totalDuration: 0,
        days: {}
      }

      const days = {
        ...week.days,
        [dayDate]: [
          ...week.days[dayDate] || [],
          activity
        ]
      }

      const end = activity.end || moment()
      const diff = end.diff(activity.start)

      return {
        ...weeks,
        [weekDate]: {
          ...week,
          totalDuration: week.totalDuration + diff,
          days: days
        }
      }
    }, {})
    console.timeEnd(`#${run} Render list - reduce`)

    console.time(`#${run} Render list - generate content`)
    const content = (
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
                const activities = value[1]
                return activities.filter(activity => activity.end !== undefined).length > 0
              }).sort((a, b) => moment(b[0], 'll') - moment(a[0], 'll')).map(value => {
                const [day, activities] = value
                const totalDiff = activities.reduce((result, activity) => {
                  const end = activity.end || moment()
                  const diff = end.diff(activity.start)
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
    console.timeEnd(`#${run} Render list - generate content`)
    console.timeEnd(`#${run} Render list`)
    run = run + 1
    return content
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
