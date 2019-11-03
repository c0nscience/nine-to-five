import React, {Component} from 'react'
import {connect} from 'react-redux'
import classNames from 'classnames'
import {withStyles} from '@material-ui/core/styles'
import {startActivity} from '../actions'
import StartButton from './ActivityStartButton'
import TextField from "@material-ui/core/TextField"
import Grid from "@material-ui/core/Grid"
import Paper from "@material-ui/core/Paper"

const styles = theme => ({
  paper: {
    paddingTop: theme.spacing(3),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(6),
    marginBottom: theme.spacing(4),
    position: 'relative'
  },
  loadingPaper: {
    paddingTop: theme.spacing(3) - 5,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(6),
    marginBottom: theme.spacing(4),
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
    this.setState({name})
  }

  handleRequestSave(event) {
    event.preventDefault()
    this.setState({name: ''})
    this.props.startActivity(this.state.name)
  }


  render() {
    const {classes, loading} = this.props
    return (
      <Paper className={classNames({
        [classes.loadingPaper]: loading,
        [classes.paper]: !loading
      })}>
        <form onSubmit={this.handleRequestSave}>
          <Grid container spacing={0}>
            <Grid item xs={12}>
              <TextField
                id="name"
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
