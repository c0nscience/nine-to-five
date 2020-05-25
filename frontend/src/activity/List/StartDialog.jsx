import React from 'react'
import Dialog from '@material-ui/core/Dialog'
import {DialogTitle, useMediaQuery} from '@material-ui/core'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import useTheme from '@material-ui/core/styles/useTheme'

const StartDialog = ({open}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return <Dialog open={open}
                 fullScreen={fullScreen}>
    <DialogTitle>Start New Activity</DialogTitle>
    <DialogContent>

    </DialogContent>
    <DialogActions>
      <Button data-testid='cancel-btn'>Cancel</Button>
      <Button data-testid='start-btn'>Start</Button>
    </DialogActions>
  </Dialog>
}

export default StartDialog
