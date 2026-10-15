import http from '@/axios/index.js';
import {useNotifyStore} from '@/store/notify.js';

export function emailUnread() {
    return http.get('/email/unread', {noMsg: true, timeout: 15 * 1000})
}

export function emailList(accountId, allReceive, emailId, timeSort, size, type, filter = {}) {
    const {keyword, unread, starred} = filter
    return http.get('/email/list', {params: {accountId, allReceive, emailId, timeSort, size, type, keyword: keyword || undefined, unread: unread ? 1 : undefined, starred: starred ? 1 : undefined}})
}

export function emailDelete(emailIds) {
    return http.delete('/email/delete?emailIds=' + emailIds).then(data => {
        useNotifyStore().refresh()
        return data
    })
}

export function emailRestore(emailIds) {
    return http.put('/email/restore', {emailIds: emailIds.join(',')}).then(data => {
        useNotifyStore().refresh()
        return data
    })
}

export function emailLatest(emailId, accountId, allReceive) {
    return http.get('/email/latest', {params: {emailId, accountId, allReceive}, noMsg: true, timeout: 35 * 1000})
}

export function emailRead(emailIds) {
    return http.put('/email/read', {emailIds}).then(data => {
        useNotifyStore().refresh()
        return data
    })
}

export function emailSend(form,progress) {
    return http.post('/email/send', form,{
        onUploadProgress: (e) => {
            progress(e)
        },
        noMsg: true
    })
}