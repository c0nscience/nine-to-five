import React from 'react'
import { connect } from 'react-redux'
import LinearProgress from "@material-ui/core/LinearProgress";

const LoadingIndicator = ({ runningRequests }) => {
  const loading = runningRequests.length > 0
  return (
    loading && <LinearProgress/>
  )
}

const mapStateToProps = state => ({
  runningRequests: state.network.runningRequests
})

export default connect(
  mapStateToProps
)(LoadingIndicator)
