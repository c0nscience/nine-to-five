import React from 'react'
import {withStyles} from '@material-ui/core/styles';
import {connect} from 'react-redux'
import {goBack} from 'connected-react-router'
import {createLog} from "../actions";
import Button from "@material-ui/core/Button/Button";
import CardActions from "@material-ui/core/CardActions";
import TextField from "@material-ui/core/TextField";
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card/Card";
import Grid from "@material-ui/core/Grid";

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  card: {
    marginBottom: theme.spacing(3),
  },
})

const initialState = {
  name: ''
}

class NewLogForm extends React.Component {
  state = initialState

  constructor() {
    super()
    this.handleNameChange = this.handleNameChange.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
    this.handleRequestSave = this.handleRequestSave.bind(this)
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
    const {name} = this.state
    this.props.createLog({
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
              <h1>New Log</h1>

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

const mapStateToProps = state => ({})

const mapDispatchToProps = {
  goBack,
  createLog
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(NewLogForm))
