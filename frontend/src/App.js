import React from 'react'
import './App.css'
import { withStyles } from 'material-ui/styles'
import ActivityForm from './activity/ActivityForm'
import ActivityList from './activity/ActivityList'
import Paper from 'material-ui/Paper'
import withRoot from './component/withRoot'

const styles = theme => ({
  root: theme.mixins.gutters({
    paddingTop: 16,
    paddingBottom: 16,
    margin: theme.spacing.unit * 3,
  }),
})

const App = (props) => {
  const { classes } = props
  return (
    <Paper className={classes.root} elevation={4}>
      <ActivityForm/>
      <ActivityList/>
    </Paper>
  )
}
export default withRoot(withStyles(styles)(App))
