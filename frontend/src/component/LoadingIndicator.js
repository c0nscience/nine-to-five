import React from 'react'
import LinearProgress from '@material-ui/core/LinearProgress'
import {useNetworkActivity} from 'contexts/NetworkContext'

const LoadingIndicator = () => {
  const {runningRequests} = useNetworkActivity()
  const loading = runningRequests && runningRequests.length > 0
  return loading ? <LinearProgress/> : null
}

export default LoadingIndicator
