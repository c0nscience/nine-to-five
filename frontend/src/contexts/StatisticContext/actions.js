export const LOAD_OVERTIME = 'LOAD_OVERTIME'
export const OVERTIME_LOADED = 'OVERTIME_LOADED'

export const overtimeLoaded = overtime =>
  ({type: OVERTIME_LOADED, payload: overtime})
