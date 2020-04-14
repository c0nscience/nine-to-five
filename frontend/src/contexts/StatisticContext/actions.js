export const LOAD_OVERTIME = 'LOAD_OVERTIME'
export const OVERTIME_LOADED = 'OVERTIME_LOADED'

export const overtimeLoaded = overtime =>
  ({type: OVERTIME_LOADED, payload: overtime})

export const LOAD_CONFIGURATIONS = 'LOAD_CONFIGURATIONS'
export const CONFIGURATIONS_LOADED = 'CONFIGURATIONS_LOADED'

export const configurationsLoaded = configs =>
  ({type: CONFIGURATIONS_LOADED, payload: configs})

export const SAVE_CONFIGURATION = 'SAVE_CONFIGURATION'
export const CONFIGURATION_UPDATED = 'CONFIGURATION_UPDATED'

export const configurationSaved = newConfig =>
  ({type: CONFIGURATION_UPDATED, payload: newConfig})
