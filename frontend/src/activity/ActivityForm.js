import React from 'react'
import { startActivity, stopActivity, updateCurrent } from '../reducers/activity'
import { connect } from 'react-redux'

const ActivityForm = (props) => {
  const {
    currentActivity,
    updateCurrent,
    startActivity,
    stopActivity
  } = props

  const handleInputChange = (event) => {
    const value = event.target.value
    updateCurrent(value)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    startActivity(currentActivity)
  }

  const handleStopButtonClick = (event) => {
    console.log('button click')
    event.preventDefault()
    stopActivity()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input type="text"
               value={currentActivity}
               onChange={handleInputChange}/>
      </div>
      <div>
        <input type="submit" value="Start"/>
        <input type="button" onClick={handleStopButtonClick} value="Stop"/>
      </div>
    </form>
  )
}

export default connect(
  state => ({ currentActivity: state.currentActivity }),
  {
    updateCurrent,
    startActivity,
    stopActivity
  }
)(ActivityForm)
