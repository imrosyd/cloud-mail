import {computed, ref} from "vue";
import {useUiStore} from "@/store/ui.js";
import {useSettingStore} from "@/store/setting.js";
import {toOssDomain} from "@/utils/convert.js";
import {blockRemoteImages} from "@/utils/remote-images.js";

/**
 * Applies the user's "block remote images" choice to the message being shown.
 * `getEmail` returns the current message, `formatImage` fills in the app's own storage domain.
 */
export function useRemoteImagePolicy(getEmail, formatImage) {
    const uiStore = useUiStore()
    const settingStore = useSettingStore()
    const allowedId = ref(0)

    // Attachments stored by the app itself are not the sender's tracking surface
    const ownHost = computed(() => {
        try {
            return new URL(toOssDomain(settingStore.settings.r2Domain)).host
        } catch (e) {
            return ''
        }
    })

    const result = computed(() => {
        const email = getEmail()
        const html = formatImage(email.content)
        if (!uiStore.blockRemoteImages || allowedId.value === email.emailId) return {html, count: 0}
        return blockRemoteImages(html, ownHost.value)
    })

    return {
        html: computed(() => result.value.html),
        hiddenCount: computed(() => result.value.count),
        showImages: () => {
            allowedId.value = getEmail().emailId
        }
    }
}
