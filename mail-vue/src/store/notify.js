import { defineStore } from 'pinia'

export const useNotifyStore = defineStore('notify', {
    state: () => ({
        unreadTotal: 0,
        unreadAccounts: {},
        refreshTick: 0,
        desktop: false,
        sound: true,
    }),
    actions: {
        refresh() {
            this.refreshTick++
        }
    },
    persist: {
        pick: ['desktop', 'sound'],
    },
})
