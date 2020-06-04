import '@testing-library/jest-dom'

import React from 'react'
import {render} from '@testing-library/react'
import {Edit} from 'Metrics/Edit'

describe('Metric Edit Page', () => {
  it('should display a name input field filled with the current value', () => {
    const metric = {
      name: 'Overtime'
    }

    const {getByTestId} = render(<Edit metricConfiguration={metric}/>)

    expect(getByTestId('form')).toHaveFormValues({
      name: 'Overtime'
    })
  })

  it('should display a formula input field filled with the current value', () => {
    const metric = {
      formula: 'sum'
    }

    const {getByTestId} = render(<Edit metricConfiguration={metric}/>)

    expect(getByTestId('form')).toHaveFormValues({
      formula: 'sum'
    })
  })

  it('should display a tags input field filled with the current value', () => {
    const metric = {
      tags: ['meeting']
    }

    const {getByTestId, debug} = render(<Edit metricConfiguration={metric}/>)

    debug()

    expect(getByTestId('value-meeting')).toHaveTextContent('meeting')
  })

  it('should display a unit input field filled with the current value', () => {
    const metric = {
      unit: 'WEEKS'
    }

    const {getByTestId} = render(<Edit metricConfiguration={metric}/>)

    expect(getByTestId('form')).toHaveFormValues({
      unit: 'WEEKS'
    })
  })

  it('should display a threshold input field filled with the current value', () => {
    const metric = {
      threshold: 40.0
    }

    const {getByTestId} = render(<Edit metricConfiguration={metric}/>)

    expect(getByTestId('form')).toHaveFormValues({
      threshold: 40
    })
  })
})
