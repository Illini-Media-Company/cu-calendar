import { useEffect, type RefObject } from 'react'

interface ResizeMessage {
  type: string
  source: 'cu-calendar'
  height: number
}

function postResize(height: number) {
  if (!window.parent || window.parent === window) {
    return
  }

  const baseMessage: Omit<ResizeMessage, 'type'> = {
    source: 'cu-calendar',
    height,
  }

  window.parent.postMessage(
    {
      type: 'imc:iframe:resize',
      ...baseMessage,
    } satisfies ResizeMessage,
    '*',
  )

  window.parent.postMessage(
    {
      type: 'iframe:resize',
      ...baseMessage,
    } satisfies ResizeMessage,
    '*',
  )
}

export function useIframeAutoResize(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = containerRef.current

    if (!element) {
      return
    }

    const notify = () => {
      const height = Math.ceil(element.getBoundingClientRect().height)
      postResize(height)
    }

    notify()

    const observer = new ResizeObserver(() => {
      notify()
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [containerRef])
}
