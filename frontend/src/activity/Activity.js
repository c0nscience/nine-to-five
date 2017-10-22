import React from 'react'
import Grid from 'material-ui/Grid'
import { withStyles } from 'material-ui/styles'
import ActivityForm from './ActivityForm'
import ActivityList from './ActivityList'
import { Card, CardContent } from 'material-ui'

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  card: theme.mixins.gutters({
    marginBottom: theme.spacing.unit * 3,
  }),
})


const Activity = ({ classes }) => (
  <Grid container justify="center" className={classes.root}>
    <Grid item xs={12} sm={10}>
      <Card className={classes.card}>
        <CardContent>
          <ActivityForm/>
        </CardContent>
      </Card>
      <ActivityList/>
    </Grid>
  </Grid>
)

export default withStyles(styles)(Activity)
