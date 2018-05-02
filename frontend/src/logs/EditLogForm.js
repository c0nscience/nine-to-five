import React from 'react'
import TextField from 'material-ui/TextField'
import {Button, Card, CardActions, CardContent, Grid} from 'material-ui'
import {withStyles} from 'material-ui/styles'
import {connect} from 'react-redux'
import {goBack} from 'connected-react-router'
import { updateLog } from "../actions";

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  card: {
    marginBottom: theme.spacing.unit * 3,
  },
})

const initialState = {
  id: '',
  name: ''
}

class EditLogForm extends React.Component {

  constructor() {
    super()
    this.state = initialState
    this.handleNameChange = this.handleNameChange.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
    this.handleRequestSave = this.handleRequestSave.bind(this)
  }

  static getDerivedStateFromProps({id, name}) {
    return {
      id,
      name
    }
  }

  handleNameChange(event) {
    const name = event.target.value
    this.setState({name})
  }

  handleCancel(event) {
    event.preventDefault()
    this.setState(initialState)
    this.props.goBack()
  }

  handleRequestSave(event) {
    event.preventDefault()
    const {id, name} = this.state
    this.props.updateLog({
      id,
      name
    });
  }

  render() {
    const {classes} = this.props

    return <div>
      <Grid container justify="center" spacing={0} className={classes.root}>
        <Grid item xs={12} sm={10}>
          <Card>
            <CardContent>
              <h1>Edit Log</h1>

              <form>
                <TextField
                  id="name"
                  label="Name"
                  type="text"
                  fullWidth
                  value={this.state.name}
                  onChange={this.handleNameChange}/>
              </form>
            </CardContent>
            <CardActions>
              <Button onClick={this.handleCancel} color="secondary">
                Delete
              </Button>
              <Button onClick={this.handleCancel}>
                Cancel
              </Button>
              <Button onClick={this.handleRequestSave} disabled={this.state.name.length < 3}
                      color="primary">
                Save
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </div>
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...(state.activity.logs.find(l => l.id === ownProps.match.params.id) || initialState),
})

const mapDispatchToProps = {
  goBack,
  updateLog
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(EditLogForm))
