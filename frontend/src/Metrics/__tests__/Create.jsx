import '@testing-library/jest-dom'

import React from 'react'
import {fireEvent, getByTestId, render} from '@testing-library/react'
import {CreatePage} from '../CreatePage'
import {useHistory} from 'react-router'
import {within} from "@testing-library/dom";

jest.mock('react-router')

beforeEach(() => {
  useHistory.mockReturnValue({
    push: v => console.log(`push '${v}' to the history`)
  })
})


describe('Create Metric Page', () => {
  it('should contain a name field', () => {
    const {getByTestId} = render(<CreatePage/>)

    expect(getByTestId('name')).toBeVisible()
  })

  it('should contain a tags field', () => {
    const {getByTestId} = render(<CreatePage/>)

    expect(getByTestId('tags')).toBeVisible()
  })

  it('should contain a formula field', () => {
    const {getByTestId} = render(<CreatePage/>)

    expect(getByTestId('formula')).toBeVisible()
  })

  it('should contain a threshold field', () => {
    const {getByTestId} = render(<CreatePage/>)

    expect(getByTestId('threshold')).toBeVisible()
  })

  describe('has time unit select field', () => {
    it('should exist', () => {
      const {getByTestId} = render(<CreatePage/>)

      expect(getByTestId('time-unit')).toBeVisible()
    })

    it('should contain \'week\' as time unit', () => {
      const {getByRole, getByTestId, debug} = render(<CreatePage/>)
      const {getByRole: childByRole} = within(getByTestId('time-unit'))
      const button = childByRole['button'];
      fireEvent.click(button)

debug()
      expect(getByRole('option')).toHaveTextContent('Week')
    })
  })

  it('should have a save button', () => {
    const {getByTestId} = render(<CreatePage/>)

    expect(getByTestId('save-button')).toBeVisible()
  })

  it('should have a cancel button', () => {
    const {getByTestId} = render(<CreatePage/>)

    expect(getByTestId('cancel-button')).toBeVisible()
  })
})
