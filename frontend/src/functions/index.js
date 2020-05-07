import {Duration} from 'luxon'

export const positiveDurationFrom = isoDurationString => {
  const duration = Duration.fromISO(isoDurationString)
  if (duration.valueOf() > 0) {
    return duration
  } else {
    return ZERO_DURATION()
  }
}

export const ZERO_DURATION = () => Duration.fromMillis(0)

export const formatDuration = duration => {
  if (!duration) {
    return ''
  }

  if (typeof duration === 'string') {
    duration = Duration.fromISO(duration)
  }

  return duration.toFormat('h\'h\' m\'m\'')
}
