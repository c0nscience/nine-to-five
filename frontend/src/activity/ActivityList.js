import React, { Component } from 'react'
import { connect } from 'react-redux'
import ActivityItem from './ActivityItem'
import { loadActivities } from '../reducers/activity'
import List from 'material-ui/List'
import Divider from 'material-ui/Divider'

class ActivityList extends Component {

  componentDidMount() {
    this.props.loadActivities()
  }

  render() {
    const { activities } = this.props
    return (
      <List>
        {activities.map(activity => (
          <div key={activity.id}>
            <ActivityItem {...activity}
                          isRunning={activity.end === undefined}/>
            <Divider light/>
          </div>
        ))}
      </List>
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
)(ActivityList)
