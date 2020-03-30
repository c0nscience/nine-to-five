import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react'
import {useNetworkActivity} from 'contexts/NetworkContext'
import {useActivity} from 'contexts/ActivityContext'
import {DateTime} from 'luxon'

const InfiniteScrollingContext = createContext()

export const InfiniteScrollingProvider = ({children}) => {
  const {runningRequests} = useNetworkActivity()
  const {loadActivitiesInRange, hasMore} = useActivity()
  const [page, setPage] = useState(0)
  const [loadingNewEntries, setLoadingNewEntries] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    if (hasMore && page > 0) {
      const now = DateTime.local()
      const from = now.minus({day: 7 * (page + 1)})
      const to = now.minus({day: 7 * page})

      console.log(`start loading ${from.toISODate()} to ${to.toISODate()}`)
      loadActivitiesInRange(from, to, signal)
    }
    return () => controller.abort()
  }, [page, hasMore])

  const observer = useRef()
  const lastElementRef = useCallback(node => {
    if (runningRequests.length > 0) {
      return
    }

    if (observer.current) {
      observer.current.disconnect()
    }

    observer.current = new IntersectionObserver(entries => {
      setLoadingNewEntries(entries[0].isIntersecting)
      if (entries[0].isIntersecting) {
        setPage(previousPageNumber => previousPageNumber + 1)
      }
    })

    if (node) {
      observer.current.observe(node)
    }

  }, [runningRequests])

  return <InfiniteScrollingContext.Provider value={{
    lastElementRef,
    loadingNewEntries
  }}>
    {children}
  </InfiniteScrollingContext.Provider>
}

export const useInfiniteScrolling = () => useContext(InfiniteScrollingContext)
