<template>
  <emailScroll ref="scroll"
               :cancel-success="cancelStar"
               :star-success="addStar"
               :getEmailList="getEmailList"
               :emailDelete="emailDelete"
               :star-add="starAdd"
               :star-cancel="starCancel"
               :time-sort="params.timeSort"
               :email-read="emailRead"
               :show-unread="true"
               actionLeft="4px"
               @jump="jumpContent"
  >
    <template #first>
      <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-down-outline"
            v-if="params.timeSort === 0" width="28" height="28"/>
      <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-up-outline" v-else
            width="28" height="28"/>
    </template>

  </emailScroll>
</template>

<script setup>
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {useNotifyStore} from "@/store/notify.js";
import emailScroll from "@/components/email-scroll/index.vue"
import {emailList, emailDelete, emailRead} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {defineOptions, h, onMounted, reactive, ref, watch} from "vue";
import router from "@/router/index.js";
import {Icon} from "@iconify/vue";

defineOptions({
  name: 'email'
})

const emailStore = useEmailStore();
const accountStore = useAccountStore();
const notifyStore = useNotifyStore();
const scroll = ref({})
const params = reactive({
  timeSort: 0,
})

onMounted(() => {
  emailStore.emailScroll = scroll;
})


// New mail found by the global notifier goes straight into the list,
// so the list updates together with the badge and the toast
watch(() => notifyStore.incomingTick, () => {
  if (scroll.value.firstLoad) return
  const accountId = accountStore.currentAccountId
  const allReceive = accountStore.currentAccount.allReceive
  const list = [...notifyStore.incoming].sort((a, b) => a.emailId - b.emailId)
  for (const email of list) {
    if (!allReceive && email.accountId !== accountId) continue
    if (existIds.has(email.emailId)) continue
    existIds.add(email.emailId)
    scroll.value.addItem({...email, reqAccountId: accountId, allReceive})
  }
})

watch(() => accountStore.currentAccountId, () => {
  scroll.value.refreshList();
})

function changeTimeSort() {
  params.timeSort = params.timeSort ? 0 : 1
  scroll.value.refreshList();
}

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'logic'
  emailStore.contentData.showUnread = true
  emailStore.contentData.showStar = true
  emailStore.contentData.showReply = true
  router.push('/message')
}

const existIds = new Set();

function addStar(email) {
  emailStore.starScroll?.addItem(email)
}

function cancelStar(email) {
  emailStore.starScroll?.deleteEmail([email.emailId])
}

function getEmailList(emailId, size) {
  const accountId =  accountStore.currentAccountId;
  const allReceive = accountStore.currentAccount.allReceive;
  return emailList(accountId, allReceive, emailId, params.timeSort, size, 0).then(data => {
    data.latestEmail.reqAccountId = accountId;
    data.latestEmail.allReceive = allReceive;
    return data;
  })
}

</script>
<style>
.icon {
  cursor: pointer;
}
</style>
