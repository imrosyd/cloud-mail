import {onActivated, onDeactivated, onMounted, onUnmounted, ref} from "vue";

/**
 * Keyboard navigation for an email list.
 * Active only while the list's page is shown, never while typing or with a dialog open.
 * `handlers` are plain callbacks that receive the focused email.
 */
export function useListShortcuts({getList, onMove, handlers}) {
    const cursorId = ref(0)
    let active = true

    function typing(e) {
        const el = e.target
        if (!el || !el.tagName) return false
        return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
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
        } else if (current) {
            const map = {Enter: 'open', x: 'select', s: 'star', u: 'read', r: 'reply', '#': 'remove', Delete: 'remove'}
            const name = map[key]
            if (name && handlers[name]) {
                e.preventDefault()
                handlers[name](current)
            }
        }
    }

    onMounted(() => window.addEventListener('keydown', onKeydown))
    onUnmounted(() => window.removeEventListener('keydown', onKeydown))
    onActivated(() => active = true)
    onDeactivated(() => active = false)

    return {cursorId}
}
