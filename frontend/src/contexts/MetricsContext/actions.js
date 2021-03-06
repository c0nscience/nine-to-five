export const LOAD_METRIC_CONFIGURATIONS = 'LOAD_METRIC_CONFIGURATIONS'
export const METRIC_CONFIGURATIONS_LOADED = 'METRIC_CONFIGURATIONS_LOADED'

export const metricConfigurationsLoaded = configurations =>
  ({type: METRIC_CONFIGURATIONS_LOADED, payload: configurations})

export const CREATE_NEW_METRIC_CONFIGURATION = 'CREATE_NEW_METRIC_CONFIGURATION'

export const LOAD_METRIC_DETAIL = 'LOAD_METRIC_DETAIL'
export const METRIC_DETAIL_LOADED = 'METRIC_DETAIL_LOADED'

export const metricDetailLoaded = metricDetail =>
  ({type: METRIC_DETAIL_LOADED, payload: metricDetail})

export const DELETE_METRIC_CONFIGURATION = 'DELETE_METRIC_CONFIGURATION'

export const LOAD_METRIC_CONFIGURATION = 'LOAD_METRIC_CONFIGURATION'
export const METRIC_CONFIGURATION_LOADED = 'METRIC_CONFIGURATION_LOADED'

export const metricConfigurationLoaded = config =>
  ({type: METRIC_CONFIGURATION_LOADED, payload: config})

export const SAVE_METRIC_CONFIGURATION = 'SAVE_METRIC_CONFIGURATION'
