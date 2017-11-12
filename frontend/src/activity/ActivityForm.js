import React from 'react'
import { startActivity, stopActivity, updateCurrent } from '../reducers/activity'
import { connect } from 'react-redux'
import Input from 'material-ui/Input'
import Button from 'material-ui/Button'
import Grid from 'material-ui/Grid'
import { withStyles } from 'material-ui/styles'

const styles = theme => ({
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
      <Grid item xs={12}>
        <Input
          id="name"
          placeholder="Name"
          value={currentActivity}
          onChange={handleInputChange}
          margin="normal"
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
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
      </Grid>
    </div>
  )
}

export default connect(
  state => ({ currentActivity: state.activity.currentActivity }),
  {
    updateCurrent,
    startActivity,
    stopActivity
  }
)(withStyles(styles)(ActivityForm))
