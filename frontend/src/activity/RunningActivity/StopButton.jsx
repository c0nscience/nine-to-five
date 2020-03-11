import React from 'react'
import StopIcon from '@material-ui/icons/Stop'
// import {stopActivity} from '../actions'
import {Fab} from '@material-ui/core'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles(theme => ({
    button: {
      margin: 0,
      top: 'auto',
      left: 'auto',
      right: theme.spacing(3),
      bottom: -theme.spacing(3),
      position: 'absolute'
    },
    fabProgress: {
      position: 'absolute',
      top: -6,
      left: -6,
      zIndex: 1
    }
  })
)
const StopButton = () => {
  const loading = false
  const classes = useStyles()
  return (
    <div className={classes.button}>
      <Fab disabled={loading}
           color="secondary"
           aria-label="stop"
           onClick={() => {
             //  TODO call 'stopActivity' action somehow
           }}>
        <StopIcon/>
      </Fab>
    </div>
  )
}

export default StopButton
