import {useUiStore} from '@/store/ui.js'

// Light/dark switch shared by the header and the sign-in page.
// The new theme spreads out from the pointer (or the button's centre for the keyboard) where the browser supports view transitions.
export function useTheme() {
    const uiStore = useUiStore()

    function applyTheme(nextIsDark, root) {
        root.setAttribute('class', nextIsDark ? 'dark' : '')
        const metaTag = document.getElementById('theme-color-meta')
        const isMobile = !window.matchMedia('(pointer: fine) and (hover: hover)').matches
        metaTag?.setAttribute('content', nextIsDark ? (isMobile ? '#141414' : '#000000') : (isMobile ? '#FFFFFF' : '#F1F1F1'))
        uiStore.dark = nextIsDark
    }

    function toggleTheme(e) {
        const nextIsDark = !uiStore.dark
        const root = document.documentElement

        if (!document.startViewTransition) {
            applyTheme(nextIsDark, root)
            return
        }

        let x = e?.clientX
        let y = e?.clientY
        if (typeof x !== 'number' || typeof y !== 'number') {
            const rect = e?.currentTarget?.getBoundingClientRect?.()
            x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
            y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
        }

        const maxX = Math.max(x, window.innerWidth - x)
        const maxY = Math.max(y, window.innerHeight - y)
        const endRadius = Math.hypot(maxX, maxY)

        // Mark the transition target for the CSS selector
        root.setAttribute('data-theme-to', nextIsDark ? 'dark' : 'light')
        root.style.setProperty('--vt-x', `${x}px`)
        root.style.setProperty('--vt-y', `${y}px`)
        root.style.setProperty('--vt-end-radius', `${endRadius + 10}px`)

        const transition = document.startViewTransition(() => {
            applyTheme(nextIsDark, root)
        })

        transition.finished.finally(() => {
            root.removeAttribute('data-theme-to')
        })
    }

    return {toggleTheme}
}
