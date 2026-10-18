import { useEffect } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Dialog accessibility for a modal:
// - moves focus into the dialog on open (first focusable, or the dialog itself)
// - traps Tab / Shift+Tab inside the dialog
// - restores focus to the previously focused element on close/unmount
// Pass the ref of the dialog card (not the scrim). For dialogs that mount and
// unmount with their open state, omit `active`; otherwise pass the open flag.
export function useModalA11y(dialogRef, active = true) {
  useEffect(() => {
    if (!active) return
    const dialog = dialogRef.current
    if (!dialog) return

    const previouslyFocused = document.activeElement

    // Initial focus — prefer the first form control over the close button.
    const focusables = dialog.querySelectorAll(FOCUSABLE)
    const firstField = dialog.querySelector('input, select, textarea')
    const target = firstField || focusables[0] || dialog
    if (target === dialog) dialog.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return
      const items = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener('keydown', onKeyDown)
    return () => {
      dialog.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [dialogRef, active])
}
