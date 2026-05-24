import axios from "axios";
import router from "@/router";
import i18n from "@/i18n/index.js";
import {useSettingStore} from "@/store/setting.js";

let http = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL
});

http.interceptors.request.use(config => {
    const { lang } = useSettingStore();
    config.headers.Authorization = `${localStorage.getItem('token')}`
    config.headers['accept-language'] = lang
    return config
})

http.interceptors.response.use((res) => {
        const noMsg = res.config.noMsg;
        const data = res.data

        if (noMsg) {
            return data.code === 200 ? data.data : Promise.reject(data)
        }

        if (data.code === 200) {
            return data.data
        }

        if (data.code === 401) {
            ElMessage({
                message: data.message,
                type: 'error',
                plain: true,
                grouping: true,
                repeatNum: -4,
            })
            localStorage.removeItem('token')
            router.replace('/login')
            return Promise.reject(data)
        }

        if (data.code === 403) {
            ElMessage({
                message: data.message,
                type: 'warning',
                plain: true,
                grouping: true,
                repeatNum: -4,
            })
            return Promise.reject(data)
        }

        if (data.code === 502) {
            ElMessage({
                dangerouslyUseHTMLString: true,
                message: data.message,
                type: 'error',
                plain: true,
                grouping: true,
                repeatNum: -4,
            })
            return Promise.reject(data)
        }

        ElMessage({
            message: data.message,
            type: 'error',
            plain: true,
            grouping: true,
            repeatNum: -4,
        })
        return Promise.reject(data)
    },
    (error) => {

        if (error.status === 403) {
            location.reload();
            return;
        }

        const noMsg = error.config.noMsg;

        if (noMsg) {
            return Promise.reject(error)
        } else if (error.message.includes('Network Error')) {
            ElMessage({
                message: i18n.global.t('networkErrorMsg'),
                type: 'error',
                plain: true,
                grouping: true,
                repeatNum: -4,
            })
        } else if (error.code === 'ECONNABORTED') {
            ElMessage({
                message: i18n.global.t('timeoutErrorMsg'),
                type: 'error',
                plain: true,
                grouping: true
            })
        } else if (error.response) {
            ElMessage({
                message: i18n.global.t('serverBusyErrorMsg'),
                type: 'error',
                plain: true,
                grouping: true,
                repeatNum: -4,
            })
        } else {
            ElMessage({
                message: i18n.global.t('reqFailErrorMsg'),
                type: 'error',
                plain: true,
                grouping: true,
                repeatNum: -4,
            })
        }
        return Promise.reject(error)
    })

export default http


