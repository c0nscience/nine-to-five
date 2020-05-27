import '@testing-library/jest-dom'

import React from 'react'
import {render} from '@testing-library/react'

import {formatDuration} from 'functions/index'
import {Duration} from 'luxon'

describe('formatDuration', () => {
  it('should put the minutes into a seconds line if specified', () => {
    const result = formatDuration(Duration.fromISO('PT2H20M'), {
      multiline: true
    })

    const {container} = render(result)


    expect(container).toMatchInlineSnapshot(`
    <div>
      2h
      <br />
      20m
    </div>
    `)
  })

  it('should put the minutes into a seconds line if specified for one hour duration', () => {
    const result = formatDuration(Duration.fromISO('PT1H0M'), {
      multiline: true
    })

    const {container} = render(result)


    expect(container).toMatchInlineSnapshot(`
    <div>
      1h
      <br />
      0m
    </div>
    `)
  })

  it('only show minutes if hours are less then 1 and if displayed in multiline', () => {
    const result = formatDuration(Duration.fromISO('PT30M'), {
      multiline: true
    })

    const {container} = render(result)


    expect(container).toMatchInlineSnapshot(`
    <div>
      30m
    </div>
    `)
  })
})
