import {onActivated, onDeactivated, onMounted, onUnmounted, ref} from "vue";

/**
 * Keyboard navigation for an email list.
 * Active only while the list's page is shown, never while typing or with a dialog open.
 * `handlers` are plain callbacks that receive the focused email.
 */
export function useListShortcuts({getList, onMove, handlers}) {
    const cursorId = ref(0)
    // The cursor outline is for keyboard use only, a mouse click must not leave it behind
    const kbd = ref(false)
    let active = true

    // Only fields that take typed text block the shortcuts; a focused checkbox or radio button must not
    const TEXT_TYPES = ['text', 'search', 'email', 'password', 'number', 'url', 'tel']

    function typing(e) {
        const el = e.target
        if (!el || !el.tagName) return false
        if (el.isContentEditable) return true
        if (el.tagName === 'INPUT') return TEXT_TYPES.includes((el.type || 'text').toLowerCase())
        return ['TEXTAREA', 'SELECT'].includes(el.tagName)
    }

    function dialogOpen() {
        return [...document.querySelectorAll('.el-dialog, .el-message-box, .el-dropdown-menu')]
            .some(el => el.getClientRects().length > 0)
    }

    function move(step) {
        const list = getList()
        if (!list.length) return
        const at = list.findIndex(item => item.emailId === cursorId.value)
        const next = Math.min(list.length - 1, Math.max(0, at === -1 ? (step > 0 ? 0 : list.length - 1) : at + step))
        cursorId.value = list[next].emailId
        kbd.value = true
        onMove?.(next)
    }

    function onKeydown(e) {
        if (!active || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
        if (typing(e) || dialogOpen()) return
        const key = e.key
        const current = getList().find(item => item.emailId === cursorId.value)
        if (key === 'j' || key === 'ArrowDown') {
            e.preventDefault()
            move(1)
        } else if (key === 'k' || key === 'ArrowUp') {
            e.preventDefault()
            move(-1)
        } else if (key === '?') {
            e.preventDefault()
            handlers.help?.()
        } else if (current) {
            const map = {Enter: 'open', x: 'select', s: 'star', u: 'read', r: 'reply', '#': 'remove', Delete: 'remove'}
            const name = map[key]
            if (name && handlers[name]) {
                e.preventDefault()
                handlers[name](current)
            }
        }
    }

    function onPointer() {
        kbd.value = false
    }

    onMounted(() => {
        window.addEventListener('keydown', onKeydown)
        window.addEventListener('pointerdown', onPointer, true)
    })
    onUnmounted(() => {
        window.removeEventListener('keydown', onKeydown)
        window.removeEventListener('pointerdown', onPointer, true)
    })
    onActivated(() => active = true)
    onDeactivated(() => active = false)

    return {cursorId, kbd}
}
