import React, {useState} from 'react'
import StartButton from 'activity/CreateForm/StartButton'
import TextField from '@material-ui/core/TextField'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles(theme => ({
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
)
const CreateActivityForm = () => {

  // constructor() {
  //   super()
  //   this.state = {
  //     name: ''
  //   }
  //
  //   this.handleNameChange = this.handleNameChange.bind(this)
  //   this.handleRequestSave = this.handleRequestSave.bind(this)
  // }
  //
  // handleNameChange(event) {
  //   const name = event.target.value
  //   this.setState({name})
  // }
  //
  // handleRequestSave(event) {
  //   event.preventDefault()
  //   this.setState({name: ''})
  //   this.props.startActivity(this.state.name)
  // }


  // render() {
  const [name, setName] = useState('')
  const {loading} = false //TODO fetch from network context
  const classes = useStyles()

  const startActivity = e => {
    e.preventDefault()
    setName('')
    //TODO call 'startActivity' functionality
  }

  return (
    <Paper className={loading ? classes.loadingPaper : classes.paper}>
      <form onSubmit={startActivity}>
        <Grid container spacing={0}>
          <Grid item xs={12}>
            <TextField
              id="name"
              label="Name"
              type="text"
              fullWidth
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </Grid>
        </Grid>
        <StartButton disabled={name.length < 3} onClick={startActivity}/>
      </form>
    </Paper>
  )
  // }
}

export default CreateActivityForm
