import React, {useEffect} from 'react'
import List from './List'
import Grid from '@material-ui/core/Grid'
import {useTitle} from 'contexts/TitleContext'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%'
  },
  content: {
    position: 'relative'
  }
}))

const Activity = () => {
  const {setTitle} = useTitle()
  const classes = useStyles()

  useEffect(() => {
    setTitle('Activities')
  })

  return <Grid container className={classes.root}>
    <Grid item sm={2} lg={3}/>
    <Grid item xs={12} sm={8} lg={6} className={classes.content}>
      <List/>
    </Grid>
    <Grid item sm={2} lg={3}/>
  </Grid>
}
export default Activity
