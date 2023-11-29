import { render, screen } from '@testing-library/svelte'
import { DateTime } from 'luxon'
import Card from './Card.svelte'

describe('Activity Card', () => {
  test('should render the component', async () => {
    render(Card, {
      activity: {
        id: '',
        userId: '',
        start: DateTime.local(),
        name: 'some task',
        tags: ['tag-n-1', 'tag-n-2']
      }
    })

    const name = await screen.findByText(/some task/i)
    expect(name).toBeTruthy()
  })

  test('should display tags', async () => {
    render(Card, {
      activity: {
        id: '',
        userId: '',
        start: DateTime.local(),
        name: 'some task',
        tags: ['tag-n-1', 'tag-n-2']
      }
    })
    const tags = await screen.findAllByText(/tag/i)
    expect(tags[0].innerHTML).to.contain('tag-n-1')
    expect(tags[1].innerHTML).to.contain('tag-n-2')
  })

  test('should display time', async () => {
    const now = DateTime.local()
    render(Card, {
      activity: {
        id: '',
        userId: '',
        name: 'some task',
        start: now.minus({ hour: 2, minute: 15 }),
        end: now,
        tags: ['tag-n-1', 'tag-n-2']
      }
    })

    const time = await screen.findByText(/2h/i)
    expect(time.innerHTML).to.equal('2h 15m')
  })
})
