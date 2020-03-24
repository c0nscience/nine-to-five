import React from 'react'
import StopIcon from '@material-ui/icons/Stop'
import {Fab} from '@material-ui/core'
import makeStyles from '@material-ui/core/styles/makeStyles'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {useActivity} from 'contexts/ActivityContext'

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
  const {runningRequests} = useNetworkActivity()
  const {stopActivity} = useActivity()
  const loading = runningRequests.length > 0
  const classes = useStyles()
  return <Fab disabled={loading}
              className={classes.button}
              color="secondary"
              aria-label="stop"
              onClick={() => {
                stopActivity()
              }}>
    <StopIcon/>
  </Fab>

}

export default StopButton
