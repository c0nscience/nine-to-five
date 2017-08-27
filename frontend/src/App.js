import React from 'react'
import './App.css'
import { withStyles } from 'material-ui/styles'
import ActivityForm from './activity/ActivityForm'
import ActivityList from './activity/ActivityList'
import Paper from 'material-ui/Paper'
import withRoot from './component/withRoot'
import Grid from 'material-ui/Grid'

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  paper: theme.mixins.gutters({
    paddingTop: 16,
    paddingBottom: 16,
    marginTop: theme.spacing.unit * 3,
  }),
})

const App = (props) => {
  const { classes } = props
  return (
    <Grid container justify="center" className={classes.root}>
      <Grid item xs={9} sm={6} md={6}>
        <Paper className={classes.paper} elevation={4}>
          <ActivityForm/>
          <ActivityList/>
        </Paper>
      </Grid>
    </Grid>
  )
}
export default withRoot(withStyles(styles)(App))
