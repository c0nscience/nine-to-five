import React, {useEffect} from 'react'
import List from './List'
import Grid from '@material-ui/core/Grid'
import {useTitle} from 'contexts/TitleContext'

const Activity = () => {
  const {setTitle} = useTitle()

  useEffect(() => {
    setTitle('Activities')
  })

  return <Grid container>
    <Grid item sm={3} lg={4}/>
    <Grid item xs={12} sm={6} lg={4}>
      <List/>
    </Grid>
    <Grid item sm={3} lg={4}/>
  </Grid>
}
export default Activity
