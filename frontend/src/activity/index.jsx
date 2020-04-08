import React, {useEffect} from 'react'
import {useActivity} from 'contexts/ActivityContext'
import List from './List'
import CreateForm from 'activity/CreateForm'
import RunningActivity from 'activity/RunningActivity'
import EditDialog from 'activity/EditDialog'
import {useNetworkActivity} from 'contexts/NetworkContext'
import Grid from '@material-ui/core/Grid'
import {InfiniteScrollingProvider} from 'contexts/IntiniteScrolling'
import {useTitle} from 'contexts/TitleContext'

const Activity = () => {
  const {running, selectActivity} = useActivity()
  const {runningRequests} = useNetworkActivity()
  const {setTitle} = useTitle()

  useEffect(() => {
    setTitle('Activities')
  })

  return <Grid container>
    <Grid item sm={3} lg={4}/>
    <Grid item xs={12} sm={6} lg={4}>

      {/*TODO fix error message component*/}
      {/*<ErrorMessage/>*/}

      {!running && <CreateForm/>}
      {running && <RunningActivity {...running} selectActivity={selectActivity} loading={runningRequests.length > 0}/>}

      <InfiniteScrollingProvider>
        <List/>
      </InfiniteScrollingProvider>
      <EditDialog/>
    </Grid>
    <Grid item sm={3} lg={4}/>
  </Grid>
}
export default Activity
