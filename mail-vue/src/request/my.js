import http from '@/axios/index.js';

export function loginUserInfo() {
    return http.get('/my/loginUserInfo')
}

export function resetPassword(password) {
    return http.put('/my/resetPassword', {password})
}

export function userDelete() {
    return http.delete('/my/delete')
}

export function getDomainColors() {
    return http.get('/my/domainColors', {noMsg: true})
}

export function saveDomainColors(colors) {
    return http.put('/my/domainColors', {colors})
}
