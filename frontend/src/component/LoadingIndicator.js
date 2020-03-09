import React from 'react'
import LinearProgress from '@material-ui/core/LinearProgress'

const LoadingIndicator = ({ runningRequests }) => {
  const loading = runningRequests && runningRequests.length > 0
  return <LinearProgress/>
}

const mapStateToProps = state => ({
  runningRequests: state.network.runningRequests
})

export default LoadingIndicator
