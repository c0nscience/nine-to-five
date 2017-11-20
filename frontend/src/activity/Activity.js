import React from 'react'
import Grid from 'material-ui/Grid'
import { withStyles } from 'material-ui/styles'
import ActivityList from './ActivityList'
import ActivityEditDialog from './ActivityEditDialog'
import ControlButton from './ActivityControllButton'
import ActivityCreateDialog from './ActivityCreateDialog'

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  card: {
    marginBottom: theme.spacing.unit * 3,
  },
})


const Activity = ({ classes }) => (
  <Grid container justify="center" spacing={0} className={classes.root}>
    <Grid item xs={12} sm={10}>
      <ActivityList/>
      <ControlButton/>
      <ActivityEditDialog />
      <ActivityCreateDialog />
    </Grid>
  </Grid>
)

export default withStyles(styles)(Activity)
