import React from 'react'
import Button from '@material-ui/core/Button'
import {ArrowBackIos, Delete, Edit} from '@material-ui/icons'
import IconButton from '@material-ui/core/IconButton'
import Toolbar from '@material-ui/core/Toolbar'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles(theme => ({
  spacer: {
    flexGrow: 1
  }
}))

export const DetailToolBar = ({onBack, onEdit, onDelete}) => {
  const classes = useStyles()

  return <Toolbar>
    <Button color='inherit'
            startIcon={<ArrowBackIos/>}
            data-testid='back-btn'
            onClick={() => onBack()}>
      Back
    </Button>
    <div className={classes.spacer}/>
    {
      onDelete &&
      <IconButton color='inherit'
                  data-testid='delete-btn'
                  onClick={() => onDelete()}>
        <Delete/>
      </IconButton>
    }
    <IconButton color='inherit'
                edge='end'
                data-testid='edit-btn'
                onClick={() => onEdit()}>
      <Edit/>
    </IconButton>
  </Toolbar>
}
