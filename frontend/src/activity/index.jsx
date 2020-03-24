import React from 'react'
import {useActivity} from 'contexts/ActivityContext'
import List from './List'
import CreateForm from 'activity/CreateForm'
import RunningActivity from 'activity/RunningActivity'
import EditDialog from 'activity/EditDialog'
import {useNetworkActivity} from 'contexts/NetworkContext'

export default () => {
  const {running, selectActivity} = useActivity()
  const {runningRequests} = useNetworkActivity()

  return <>
    {/*TODO fix error message component*/}
    {/*<ErrorMessage/>*/}

    {!running && <CreateForm/>}
    {running && <RunningActivity {...running} selectActivity={selectActivity} loading={runningRequests.length > 0}/>}

    <List/>
    <EditDialog/>
  </>
}
