import { watch, onMounted, onBeforeUnmount } from 'vue'
import router from '@/router/index.js'
import i18n from '@/i18n/index.js'
import { emailUnread, emailLatest } from '@/request/email.js'
import { useNotifyStore } from '@/store/notify.js'
import { useSettingStore } from '@/store/setting.js'

const DEFAULT_INTERVAL = 10
const MAX_POPUPS = 3

let sessionWarned = false

// Shown once when polling stops because the session is no longer valid
export function warnSessionExpired() {
    if (sessionWarned) return
    sessionWarned = true
    ElMessage({
        message: i18n.global.t('sessionExpired'),
        type: 'warning',
        plain: true,
        duration: 0,
        showClose: true,
    })
}

function playChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const now = ctx.currentTime
        ;[880, 1320].forEach((freq, i) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.value = freq
            const start = now + i * 0.12
            gain.gain.setValueAtTime(0.0001, start)
            gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25)
            osc.connect(gain).connect(ctx.destination)
            osc.start(start)
            osc.stop(start + 0.3)
        })
        setTimeout(() => ctx.close(), 1000)
    } catch (e) {
        // Autoplay blocked before any user interaction
    }
}

let baseIcon = null

function setFaviconBadge(show) {
    const link = document.querySelector('link[rel="icon"]')
    if (!link) return
    if (!baseIcon) baseIcon = link.href
    if (!show) {
        link.href = baseIcon
        return
    }
    const img = new Image()
    img.onload = () => {
        const size = 64
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, size, size)
        ctx.beginPath()
        ctx.arc(size - 14, 14, 13, 0, Math.PI * 2)
        ctx.fillStyle = '#f56c6c'
        ctx.fill()
        ctx.lineWidth = 3
        ctx.strokeStyle = '#fff'
        ctx.stroke()
        link.href = canvas.toDataURL('image/png')
    }
    img.src = baseIcon
}

function sender(email) {
    return email.name || email.sendEmail || ''
}

function announce(list, notifyStore) {
    const t = i18n.global.t
    const shown = list.slice(0, MAX_POPUPS)

    for (const email of shown) {
        const title = t('newEmailFrom', { name: sender(email) })
        const body = email.subject || t('noSubject')

        ElNotification({
            title,
            message: body,
            type: 'info',
            position: 'bottom-right',
            duration: 6000,
            onClick: () => router.push({ name: 'email' }),
        })

        if (notifyStore.desktop && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            const n = new Notification(title, { body, icon: '/mail.png', tag: 'email-' + email.emailId })
            n.onclick = () => {
                window.focus()
                router.push({ name: 'email' })
                n.close()
            }
        }
    }

    if (notifyStore.sound) playChime()
}

export function useMailNotifier() {
    const notifyStore = useNotifyStore()
    const settingStore = useSettingStore()

    let lastId = null
    let timer = null
    let stopped = false
    let running = false

    async function poll() {
        if (stopped || running) return
        running = true
        try {
            const stat = await emailUnread()
            notifyStore.unreadTotal = stat.total
            notifyStore.unreadAccounts = stat.accounts

            if (lastId === null) {
                lastId = stat.latestId
            } else if (stat.latestId > lastId) {
                const list = await emailLatest(lastId, 0, 1)
                lastId = stat.latestId
                if (list.length > 0) {
                    notifyStore.pushIncoming(list)
                    announce(list, notifyStore)
                }
            }
        } catch (e) {
            if (e?.code === 401 || e?.code === 403) {
                stopped = true
                warnSessionExpired()
            }
        } finally {
            running = false
        }
    }

    function schedule() {
        clearTimeout(timer)
        if (stopped) return
        const sec = settingStore.settings.autoRefresh > 1 ? settingStore.settings.autoRefresh : DEFAULT_INTERVAL
        timer = setTimeout(async () => {
            await poll()
            schedule()
        }, sec * 1000)
    }

    function updateTitle() {
        const base = settingStore.settings.title || 'Cloud Mail'
        const n = notifyStore.unreadTotal
        document.title = n > 0 ? `(${n > 99 ? '99+' : n}) ${base}` : base
        setFaviconBadge(n > 0)
    }

    function onVisible() {
        if (!document.hidden) poll()
    }

    watch(() => [notifyStore.unreadTotal, settingStore.settings.title], updateTitle)
    watch(() => notifyStore.refreshTick, poll)

    onMounted(async () => {
        document.addEventListener('visibilitychange', onVisible)
        await poll()
        updateTitle()
        schedule()
    })

    onBeforeUnmount(() => {
        stopped = true
        clearTimeout(timer)
        document.removeEventListener('visibilitychange', onVisible)
        setFaviconBadge(false)
    })
}
