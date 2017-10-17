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
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
  }),
})


const Activity = ({ classes }) => (
  <Grid container justify="center" className={classes.root}>
    <Grid item xs={9} sm={6} md={6}>
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
