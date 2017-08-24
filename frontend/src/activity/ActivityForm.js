import React from 'react'
import { startActivity, updateCurrent } from "../reducers/activity"
import { connect } from "react-redux"

const ActivityForm = (props) => {
  const {currentActivity, updateCurrent, startActivity} = props
  const handleInputChange = (event) => {
    const value = event.target.value
    updateCurrent(value)
  }
  const handleSubmit = (event) => {
    event.preventDefault()
    startActivity(currentActivity)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text"
             value={currentActivity}
             onChange={handleInputChange}/>
      <input type="submit" value="Start"/>
    </form>
  )
}

export default connect(
  state => ({currentActivity: state.currentActivity}),
  {
    updateCurrent,
    startActivity
  }
)(ActivityForm)
