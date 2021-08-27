import '@testing-library/jest-dom'

import React from 'react'
import {render} from '@testing-library/react'
import {Edit} from 'Metrics/Edit'

describe.skip('Metric Edit Page', () => {
  it('should display a name input field filled with the current value', () => {
    const metric = {
      name: 'Overtime'
    }

    const {getByTestId} = render(<Edit metricConfiguration={metric}/>)

    expect(getByTestId('name')).toHaveFormValues({
      name: 'Overtime'
    })
  })

  it('should display a tags input field filled with the current value', () => {
    const metric = {
      tags: ['meeting']
    }

    const {getByTestId} = render(<Edit metricConfiguration={metric}/>)

    expect(getByTestId('value-meeting')).toHaveTextContent('meeting')
  })

  it('should display a threshold input field filled with the current value', () => {
    const metric = {
      threshold: 40.0
    }

    const {getByTestId} = render(<Edit metricConfiguration={metric}/>)

    expect(getByTestId('threshold')).toHaveFormValues({
      threshold: 40
    })
  })
})
