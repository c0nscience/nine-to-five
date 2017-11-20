import React from 'react'
import Grid from 'material-ui/Grid'
import { withStyles } from 'material-ui/styles'
import ActivityForm from './ActivityForm'
import ActivityList from './ActivityList'
import { Card, CardContent } from 'material-ui'
import ActivityEditDialog from './ActivityEditDialog'
import ControlButton from './ActivityControllButton'

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
      <Card className={classes.card}>
        <CardContent>
          <ActivityForm/>
        </CardContent>
      </Card>
      <ActivityEditDialog />
      <ActivityList/>
      <ControlButton/>
    </Grid>
  </Grid>
)

export default withStyles(styles)(Activity)
