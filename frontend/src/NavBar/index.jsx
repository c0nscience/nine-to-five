import React, {useState} from 'react'
import {makeStyles} from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import Menu from './Menu'
import {useBulkMode} from 'contexts/BulkModeContext'
import {Close, Delete} from '@material-ui/icons'
import Badge from '@material-ui/core/Badge'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'

const useStyles = makeStyles(theme => ({
    root: {
      display: 'flex'
    },
    flex: {
      flex: 1
    },
    cancelButton: {
      marginLeft: theme.spacing(2)
    },
    menuButton: {
      marginRight: theme.spacing(2)
    }
  }
))

const ConfirmDialog = ({open, handleCloseDialog, handleDelete}) => {
  return <Dialog open={open}
                 onClose={handleCloseDialog}>
    <DialogTitle>Are you sure?</DialogTitle>
    <DialogActions>
      <Button onClick={handleCloseDialog}>
        No, close!
      </Button>
      <Button onClick={handleDelete} color="secondary">
        Yes, delete!
      </Button>
    </DialogActions>
  </Dialog>
}

const Index = () => {
  const classes = useStyles()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const {bulkSelectModeEnabled, switchBulkSelectMode, selectedActivities, bulkDeleteSelection} = useBulkMode()

  return <>
    <ConfirmDialog open={isConfirmDialogOpen}
                   handleCloseDialog={() => setIsConfirmDialogOpen(false)}
                   handleDelete={() => {
                     setIsConfirmDialogOpen(false)
                     bulkDeleteSelection()
                   }}/>
    <Menu open={isDrawerOpen} closeDrawer={() => setIsDrawerOpen(false)}/>
    <div className={classes.root}>
      <AppBar position="static" elevation={0}>
        <Toolbar disableGutters>
          {
            bulkSelectModeEnabled &&
            <>
              <IconButton color='inherit' className={classes.cancelButton}
                          onClick={() => switchBulkSelectMode()}>
                <Close/>
              </IconButton>
              <IconButton color='inherit' onClick={() => setIsConfirmDialogOpen(true)}>
                <Badge badgeContent={selectedActivities.length} color='secondary'>
                  <Delete/>
                </Badge>
              </IconButton>
            </>
          }
          <div className={classes.flex}/>
          <IconButton className={classes.menuButton}
                      color="inherit"
                      aria-label="Menu"
                      onClick={() => {
                        setIsDrawerOpen(true)
                      }}>
            <MenuIcon/>
          </IconButton>
        </Toolbar>
      </AppBar>
    </div>
  </>
}

export default Index
