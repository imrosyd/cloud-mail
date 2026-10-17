import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
    state: () => ({
        asideShow: window.innerWidth > 1024,
        // Desktop sidebar: full width with labels, or a narrow icon rail
        asideWide: true,
        accountShow: false,
        backgroundLoading: true,
        changeNotice: 0,
        writerRef: null,
        changePreview: 0,
        previewData: {},
        key: 0,
        dark: false,
        // 'list' | 'right' | 'bottom': where the message is read next to the list
        listLayout: 'list',
        // Size of the list beside or above the message, in px; 0 keeps the automatic size
        listWidth: 0,
        // Hide images the sender hosts, so opening a mail does not report back to them
        blockRemoteImages: false,
        listHeight: 0,
        asideCount: {
            email: 0,
            send: 0,
            sysEmail: 0
        }
    }),
    actions: {
        showNotice() {
            this.changeNotice ++
        },
        previewNotice(data) {
            this.previewData = data
            this.changePreview ++
        }
    },
    persist: {
        pick: ['asideWide','accountShow','dark','listLayout','listWidth','listHeight','blockRemoteImages'],
    },
})
