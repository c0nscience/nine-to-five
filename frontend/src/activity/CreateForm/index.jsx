import React, {useState} from 'react'
import StartButton from 'activity/CreateForm/StartButton'
import TextField from '@material-ui/core/TextField'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import makeStyles from '@material-ui/core/styles/makeStyles'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {useActivity} from 'contexts/ActivityContext'

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
const CreateForm = () => {
  const [name, setName] = useState('')
  const {runningRequests} = useNetworkActivity()
  const {startActivity} = useActivity()
  const classes = useStyles()

  const handleSubmit = e => {
    e.preventDefault()
    startActivity(name)
    setName('')
  }

  return (
    <Paper className={runningRequests.length > 0 ? classes.loadingPaper : classes.paper}>
      <form onSubmit={handleSubmit}>
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
        <StartButton disabled={name.length < 3} onClick={handleSubmit}/>
      </form>
    </Paper>
  )
  // }
}

export default CreateForm
