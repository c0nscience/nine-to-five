import React from 'react'
import AddIcon from '@material-ui/icons/Add'
import Fab from '@material-ui/core/Fab'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles(theme => ({
    button: {
      margin: 0,
      top: 'auto',
      left: 'auto',
      right: theme.spacing(3),
      bottom: -theme.spacing(3),
      position: 'absolute'
    }
  })
)
const StartButton = ({onClick, disabled}) => {
  const classes = useStyles()
  const loading = false
  return (
    <div className={classes.button}>
      <Fab disabled={loading || disabled}
           color="primary"
           aria-label="add"
           onClick={onClick}>
        <AddIcon/>
      </Fab>
    </div>
  )
}

export default StartButton

