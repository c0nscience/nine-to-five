import '@testing-library/jest-dom'

import React from 'react'
import {render} from '@testing-library/react'
import { List } from '../List'
import { useHistory } from 'react-router'

jest.mock('react-router')

beforeEach(() => {
  useHistory.mockReturnValue({
    push: v => console.log(`push '${v}' to the history`)
  })
})

describe('Metrics List', () => {
  it('should display configured metrics with links to detail page', () => {
    const metrics = [{
      id: 'uuid',
      name: 'Overtime'
    }]

    const {getByTestId} = render(<List metrics={metrics}/>)

    expect(getByTestId('entry-uuid')).toHaveTextContent('Overtime')
    expect(getByTestId('entry-uuid')).toHaveAttribute('role', 'button')
  })

  it('should contain an add button', () => {
    const {getByTestId} = render(<List metrics={[]}/>)

    expect(getByTestId('add-button')).toBeVisible()
  })

  it('should display an empty message if no metrics are passed', () => {
    const {getByTestId} = render(<List/>)

    expect(getByTestId('empty-message')).toHaveTextContent('No metrics configured.')
  })

  it('should display an empty message if an empty metrics array is passed', () => {
    const {getByTestId} = render(<List metrics={[]}/>)

    expect(getByTestId('empty-message')).toHaveTextContent('No metrics configured.')
  })
})
