<template>
  <emailScroll type="trash" ref="scroll"
               :show-star="false"
               :getEmailList="trashList"
               :emailDelete="emailPurge"
               :show-account-icon="false"
               show-status
               actionLeft="6px"
               @jump="jumpContent"
  >
    <template #empty>
      <el-empty :description="$t('trashEmpty')"><template #image><Icon icon="lucide:mail-open" width="40" height="40"/></template></el-empty>
    </template>
  </emailScroll>
</template>

<script setup>
import {Icon} from "@iconify/vue";
import emailScroll from "@/components/email-scroll/index.vue"
import {emailPurge, emailTrashList} from "@/request/email.js";
import {useEmailStore} from "@/store/email.js";
import {defineOptions, ref} from "vue";
import router from "@/router/index.js";

defineOptions({
  name: 'trash'
})

const scroll = ref({})
const emailStore = useEmailStore();

function trashList(emailId, size) {
  return emailTrashList(emailId, 0, size)
}

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'trash'
  emailStore.contentData.showStar = false
  emailStore.contentData.showReply = false
  emailStore.contentData.showUnread = false
  router.push('/message')
}
</script>
