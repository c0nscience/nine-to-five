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

export const formatDuration = duration => duration.toFormat('h\'h\' m\'m\'')
