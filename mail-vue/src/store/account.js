    import { defineStore } from 'pinia'

export const useAccountStore = defineStore('account', {
    state: () => ({
        currentAccountId: 0,
        currentAccount: {},
        changeUserAccountName: '',
        sortBy: 'default',
    }),
    persist: {
        pick: ['sortBy'],
    },
})