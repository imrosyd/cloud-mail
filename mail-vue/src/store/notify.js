import { defineStore } from 'pinia'

export const useNotifyStore = defineStore('notify', {
    state: () => ({
        unreadTotal: 0,
        unreadAccounts: {},
        refreshTick: 0,
        incoming: [],
        incomingTick: 0,
        desktop: false,
        sound: true,
    }),
    actions: {
        refresh() {
            this.refreshTick++
        },
        pushIncoming(list) {
            this.incoming = list
            this.incomingTick++
        }
    },
    persist: {
        pick: ['desktop', 'sound'],
    },
})
