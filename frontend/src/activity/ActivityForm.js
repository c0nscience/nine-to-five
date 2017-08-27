import React from 'react'
import { startActivity, stopActivity, updateCurrent } from '../reducers/activity'
import { connect } from 'react-redux'
import TextField from 'material-ui/TextField'
import Button from 'material-ui/Button'
import { withStyles } from 'material-ui/styles'

const styles = theme => ({
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200,
  },
  button: {
    margin: theme.spacing.unit,
  },
})

const ActivityForm = (props) => {
  const {
    currentActivity,
    updateCurrent,
    startActivity,
    stopActivity,
    classes
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
    <div>
      <TextField
        id="name"
        label="Name"
        className={classes.textField}
        value={currentActivity}
        onChange={handleInputChange}
        margin="normal"
      />
      <Button raised
              color="primary"
              className={classes.button}
              disabled={currentActivity.length === 0}
              onClick={handleSubmit}>
        Start
      </Button>
      <Button raised
              color="accent"
              className={classes.button}
              onClick={handleStopButtonClick}>
        Stop
      </Button>
    </div>
  )
}

export default connect(
  state => ({ currentActivity: state.currentActivity }),
  {
    updateCurrent,
    startActivity,
    stopActivity
  }
)(withStyles(styles)(ActivityForm))
