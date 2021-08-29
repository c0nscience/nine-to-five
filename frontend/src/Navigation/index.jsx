import React from 'react'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import {Favorite, Restore} from '@material-ui/icons'
import {makeStyles} from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import {useHistory, useLocation} from 'react-router'

const useStyles = makeStyles(theme => ({
  root: {
    position: 'fixed',
    bottom: 0
  }
}))

const Navigation = () => {
  const classes = useStyles()
  const location = useLocation()
  const history = useHistory()

  return <Grid container className={classes.root}>
    <Grid item xs={12}>
      <BottomNavigation
        value={location.pathname}
        onChange={(event, newValue) => {
          history.push(newValue)
        }}
        showLabels
      >
        <BottomNavigationAction label="Activities" value="/" icon={<Restore/>}/>
        <BottomNavigationAction label="Metrics" value="/metrics" icon={<Favorite/>}/>
      </BottomNavigation>
    </Grid>
  </Grid>
}

export default Navigation
