import React, {useState} from 'react'
import {makeStyles} from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import Menu from './Menu'

const useStyles = makeStyles(theme => ({
    root: {
      display: 'flex'
    },
    flex: {
      flex: 1
    },
    menuButton: {
      marginRight: theme.spacing(2)
    }
  }
))
const Index = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const classes = useStyles()

  return <>
    <Menu open={isDrawerOpen} closeDrawer={() => setIsDrawerOpen(false)}/>
    <div className={classes.root}>
      <AppBar position="static" elevation={0}>
        <Toolbar disableGutters>
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
