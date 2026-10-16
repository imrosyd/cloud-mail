<template>
  <emailScroll ref="sendScroll"
               :cancel-success="cancelStar"
               :star-success="addStar"
               :getEmailList="getEmailList"
               :emailDelete="emailDelete"
               :star-add="starAdd"
               show-status
               actionLeft="4px"
               :star-cancel="starCancel"
               @jump="jumpContent"
               :time-sort="params.timeSort"
               :type="'send'"
  >
    <template #filters>
      <emailFilters ref="filters" @change="applyFilters"/>
    </template>
    <template #empty v-if="filtered">
      <el-empty :description="$t('noResults')">
        <el-button @click="filters.reset()">{{ $t('clearFilters') }}</el-button>
      </el-empty>
    </template>
    <template #first>
      <Icon class="icon" @click="changeTimeSort" @keydown.enter="changeTimeSort" role="button" tabindex="0"
            :title="$t('sortTip')" :aria-label="$t('sortTip')" icon="lucide:clock-arrow-down"
            v-if="params.timeSort === 0" width="20" height="20"/>
      <Icon class="icon" @click="changeTimeSort" @keydown.enter="changeTimeSort" role="button" tabindex="0"
            :title="$t('sortTip')" :aria-label="$t('sortTip')" icon="lucide:clock-arrow-up" v-else
            width="20" height="20"/>
    </template>
  </emailScroll>
</template>

<script setup>
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import emailScroll from "@/components/email-scroll/index.vue"
import emailFilters from "@/components/email-filters/index.vue"
import {emailList, emailDelete} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {computed, defineOptions, onMounted, reactive, ref, watch} from "vue";
import router from "@/router/index.js";
import {Icon} from "@iconify/vue";

defineOptions({
  name: 'send'
})

const emailStore = useEmailStore();
const accountStore = useAccountStore();
const sendScroll = ref({})
const filters = ref({})
const params = reactive({
  timeSort: 0,
  keyword: '',
  view: 'all',
})

const filtered = computed(() => !!params.keyword || params.view !== 'all')

function applyFilters({keyword, view}) {
  params.keyword = keyword
  params.view = view
  sendScroll.value.refreshList()
}

onMounted(() => {
  emailStore.sendScroll = sendScroll;
})

watch(() => accountStore.currentAccountId, () => {
  sendScroll.value.refreshList();
})

function changeTimeSort() {
  params.timeSort = params.timeSort ? 0 : 1
  sendScroll.value.refreshList();
}

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'logic'
  emailStore.contentData.showStar = true
  emailStore.contentData.showReply = true
  router.push('/message')
}

function addStar(email) {
  emailStore.starScroll?.addItem(email)
}

function cancelStar(email) {
  emailStore.starScroll?.deleteEmail([email.emailId])
}

function getEmailList(emailId, size) {
  const accountId =  accountStore.currentAccountId;
  const allReceive = accountStore.currentAccount.allReceive;
  return emailList(accountId, allReceive, emailId, params.timeSort, size, 1, {
    keyword: params.keyword,
    starred: params.view === 'starred'
  }).then(data => {
    data.latestEmail.reqAccountId = accountId;
    data.latestEmail.allReceive = allReceive;
    return data;
  })
}

</script>

<style scoped>
.icon {
  cursor: pointer;
}
</style>