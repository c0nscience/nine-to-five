import React, { Component } from 'react'
import { connect } from 'react-redux'
import ActivityItem from './ActivityItem'
import { loadActivities } from '../reducers/activity'

class ActivityList extends Component {

  componentDidMount() {
    this.props.loadActivities()
  }

  render() {
    const { activities } = this.props
    return (
      <ul>
        {activities.map(activity => <ActivityItem key={activity.id}
                                                  name={activity.name}
                                                  isRunning={activity.end === undefined}/>)}
      </ul>
    )
  }
}

const mapStateToProps = state => ({
  activities: state.activities
})
export default connect(
  mapStateToProps,
  {
    loadActivities
  }
)(ActivityList)
