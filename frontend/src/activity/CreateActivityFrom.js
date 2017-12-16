import React, { Component } from 'react'
import { connect } from 'react-redux'
import Paper from 'material-ui/Paper'
import { withStyles } from 'material-ui/styles'
import { startActivity } from '../actions'
import Grid from 'material-ui/Grid'
import StartButton from './ActivityStartButton'
import TextField from 'material-ui/TextField'

const styles = theme => ({
  paper: {
    paddingTop: theme.spacing.unit * 2 + 5,
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 6,
    marginBottom: theme.spacing.unit * 4,
    position: 'relative'
  },
  loadingPaper: {
    paddingTop: theme.spacing.unit * 2,
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 6,
    marginBottom: theme.spacing.unit * 4,
    position: 'relative'
  }
})

class CreateActivityForm extends Component {

  constructor() {
    super()
    this.state = {
      name: ''
    }

    this.handleNameChange = this.handleNameChange.bind(this)
    this.handleRequestSave = this.handleRequestSave.bind(this)
  }

  handleNameChange(event) {
    const name = event.target.value
    this.setState({ name })
  }

  handleRequestSave(event) {
    event.preventDefault()
    this.setState({ name: '' })
    this.props.startActivity(this.state.name)
  }


  render() {
    const { classes, loading } = this.props
    return (
      <div>
        <Paper className={loading ? classes.loadingPaper : classes.paper}>
          <form onSubmit={this.handleRequestSave}>
            <Grid container spacing={0}>
              <Grid item xs={12}>
                <TextField
                  id="name"
                  autoFocus
                  label="Name"
                  type="text"
                  fullWidth
                  value={this.state.name}
                  onChange={this.handleNameChange}
                />
              </Grid>
            </Grid>
            <StartButton disabled={this.state.name.length < 3} onClick={this.handleRequestSave}/>
          </form>
        </Paper>
      </div>
    )
  }
}

const mapDispatchToProps = {
  startActivity
}

export default connect(
  null,
  mapDispatchToProps,
)(withStyles(styles)(CreateActivityForm))
