import '@testing-library/jest-dom'

import React from 'react'
import {render} from '@testing-library/react'
import List from '../List'

describe('Metrics List', () => {
  it('should display configured metrics with links to detail page', () => {
    const metrics = [{
      id: 'uuid',
      name: 'Overtime'
    }]

    const {getByTestId} = render(<List metrics={metrics}/>)

    expect(getByTestId('entry-uuid')).toHaveTextContent('Overtime')
    expect(getByTestId('link-uuid')).toHaveAttribute('href', '/metrics/uuid')
  })

  it('should contain an add button', () => {
    const {getByTestId} = render(<List metrics={[]}/>)

    expect(getByTestId('add-button')).toBeVisible()
  })
})
