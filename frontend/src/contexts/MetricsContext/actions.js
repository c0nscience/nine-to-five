export const LOAD_METRIC_CONFIGURATIONS = 'LOAD_METRIC_CONFIGURATIONS'
export const METRIC_CONFIGURATIONS_LOADED = 'METRIC_CONFIGURATIONS_LOADED'

export const metricConfigurationLoaded = configurations =>
  ({type: METRIC_CONFIGURATIONS_LOADED, payload: configurations})
