import '@testing-library/jest-dom'

import React from 'react'
import {render} from '@testing-library/react'

import {callValueWith, formatDuration} from 'functions/index'
import {Duration} from 'luxon'

describe('functions', () => {

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

  describe('callValueWith', () => {
    it('should call f with value of event', () => {
      const f = jest.fn()
      callValueWith(f)({target: {value: 'val', checked: false, type: 'input'}})

      expect(f.mock.calls[0][0]).toBe('val')
    })

    it('should call f with an empty string of event', () => {
      const f = jest.fn()
      callValueWith(f)({target: {value: '', checked: false, type: 'input'}})

      expect(f.mock.calls[0][0]).toBe('')
    })

    it('should call f with the checked value', () => {
      const f = jest.fn()
      callValueWith(f)({target: {value: '', checked: true, type: 'checkbox'}})

      expect(f.mock.calls[0][0]).toBe(true)
    })
  })


})
