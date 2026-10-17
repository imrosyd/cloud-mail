import {ref, onMounted, onBeforeUnmount} from 'vue'

// Below this width the sidebar is a drawer instead of a permanent column
const BREAKPOINT = 1025

export function useIsMobile() {
    const isMobile = ref(window.innerWidth < BREAKPOINT)
    const onResize = () => { isMobile.value = window.innerWidth < BREAKPOINT }
    onMounted(() => window.addEventListener('resize', onResize))
    onBeforeUnmount(() => window.removeEventListener('resize', onResize))
    return isMobile
}
