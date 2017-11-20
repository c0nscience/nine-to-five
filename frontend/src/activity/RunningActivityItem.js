import React from 'react'
import { connect } from 'react-redux'
import Paper from 'material-ui/Paper'
import Typography from 'material-ui/Typography'
import IconButton from 'material-ui/IconButton'
import moment from 'moment'
import { withStyles } from 'material-ui/styles'
import Edit from 'material-ui-icons/Edit'
import { selectActivity } from '../reducers/activity'

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit * 2
  },
  subHeadline: {
    marginTop: theme.spacing.unit * 2,
    paddingLeft: theme.spacing.unit * 2
  }
})

const timeFormat = 'HH:mm'

const RunningActivityItem = (props) => {
  const { classes, activities } = props
  return (
    activities.filter(activity => activity.end === undefined)
      .map(runningActivity => {
        const { id, name, start: startUtc } = runningActivity

        const localStart = moment.utc(startUtc).local()

        const duration = moment.duration(moment().diff(moment(localStart))).humanize()
        const period = `${duration} from ${localStart.format(timeFormat)}`

        return (
          <div key={id}>
            <Typography type="subheading" className={classes.subHeadline}>
              Running
            </Typography>
            <Paper className={classes.paper}>
              <Typography type="title">
                {name}
              </Typography>
              <Typography>
                {period}
              </Typography>
              <IconButton aria-label="Edit"
                          onClick={() => {
                            props.selectActivity({
                              id,
                              name,
                              start: localStart
                            })
                          }}>
                <Edit/>
              </IconButton>
            </Paper>
          </div>
        )
      })
  )
}

const mapStateToProps = state => ({
  activities: state.activity.activities
})
const mapDispatchToProps = {
  selectActivity
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withStyles(styles)(RunningActivityItem))
