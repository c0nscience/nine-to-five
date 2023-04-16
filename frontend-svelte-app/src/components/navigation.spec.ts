import { fireEvent, render, screen } from '@testing-library/svelte'
import { DateTime } from 'luxon'
import { currentDate } from '../stores/navigation'
import NavigationBar from './NavigationBar.svelte'

describe('NavigationBar', () => {
  afterEach(() => {
    currentDate.set(DateTime.local())
  })

  test('should render the component', async () => {
    render(NavigationBar)

    const currentDateLabel = await screen.findByTestId('current-date-label')
    expect(currentDateLabel.innerHTML).to.equal('Today')
  })

  test('should go to previous day on left arrow click', async () => {
    render(NavigationBar)

    const btn = screen.getByTestId('prev-btn')
    await fireEvent.click(btn)

    const currentDateLabel = await screen.findByTestId('current-date-label')

    const expected = DateTime.local().minus({ day: 1 }).toFormat('EEE, DD')
    expect(currentDateLabel.innerHTML).to.equal(expected)
  })

  test('should go to next day on right arrow click', async () => {
    render(NavigationBar)

    const btn = screen.getByTestId('next-btn')
    await fireEvent.click(btn)

    const currentDateLabel = await screen.findByTestId('current-date-label')

    const expected = DateTime.local().plus({ day: 1 }).toFormat('EEE, DD')
    expect(currentDateLabel.innerHTML).to.equal(expected)
  })

  test('should reset date to today clicking current date label', async () => {
    render(NavigationBar)

    const btn = screen.getByTestId('next-btn')
    await fireEvent.click(btn)

    const currentDateLabel = await screen.findByTestId('current-date-label')
    await fireEvent.click(currentDateLabel)

    expect(currentDateLabel.innerHTML).to.equal('Today')
  })
})
