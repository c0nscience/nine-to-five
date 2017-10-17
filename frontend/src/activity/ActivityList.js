import React, { Component } from 'react'
import { connect } from 'react-redux'
import ActivityItem from './ActivityItem'
import { loadActivities } from '../reducers/activity'
import { withStyles } from 'material-ui/styles'
import List from 'material-ui/List'
import Divider from 'material-ui/Divider'
import moment from 'moment'
import { Card, CardContent, Typography } from 'material-ui'

const styles = theme => ({
  card: theme.mixins.gutters({
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
  }),
})

class ActivityList extends Component {

  componentDidMount() {
    this.props.loadActivities()
  }

  render() {
    const { activities, classes } = this.props
    const byDay = activities.reduce(function (groups, item) {
      const start = item['start']
      const localStart = moment.utc(start).local().format('ll')
      groups[localStart] = groups[localStart] || []
      groups[localStart].push(item)
      return groups
    }, {})
    console.log(byDay)
    return (
      <div>
        {Object.entries(byDay).map(value => {
          const [day, activities] = value
          const totalDiff = activities.reduce((result, activity) => {
            const localStart = moment.utc(activity.start).local()
            const localEnd = moment.utc(activity.end).local()

            const diff = moment(localEnd).diff(moment(localStart))
            return result + diff
          }, 0)

          const totalDurationAsHours = moment.duration(totalDiff).asHours().toPrecision(2)
          return (
            <Card className={classes.card}>
              <CardContent>
                <Typography type="body1">
                  {day} - {totalDurationAsHours} h
                </Typography>
                <List>
                  {activities.map(activity => (
                    <div key={activity.id}>
                      <ActivityItem {...activity}
                                    isRunning={activity.end === undefined}/>
                      <Divider light/>
                    </div>
                  ))}
                </List>
              </CardContent>
            </Card>
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
