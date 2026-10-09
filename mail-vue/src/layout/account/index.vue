<template>
  <div class="account-box">
    <div class="head-opt">
      <Icon v-perm="'account:add'" class="icon add" icon="ion:add-outline" width="23" height="23" @click="add"/>
      <Icon class="icon refresh" icon="ion:reload" width="18" height="18" @click="refresh"/>
      <div class="list-tools">
        <Icon class="icon" icon="ion:color-palette-outline" width="19" height="19" @click="openColors"/>
        <el-select v-model="domainFilter" size="small" class="domain-filter" clearable
                   :placeholder="$t('allDomains')" @visible-change="v => v && ensureAll()">
          <el-option v-for="d in domainOptions" :key="d.domain" :value="d.domain" :label="`${d.domain} (${d.count})`">
            <span class="domain-dot" :style="{background: domainColor(d.domain)}"></span>
            <span>{{ d.domain }}</span>
            <span class="domain-count">{{ d.count }}</span>
          </el-option>
        </el-select>
        <el-dropdown trigger="click" @command="changeSort">
          <Icon class="icon" :class="{'sort-active': accountStore.sortBy !== 'default'}" icon="ion:swap-vertical-outline" width="19" height="19"/>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="o in sortOptions" :key="o.value" :command="o.value"
                                :class="{'sort-chosen': accountStore.sortBy === o.value}">{{ o.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <el-scrollbar class="scrollbar" ref="scrollbarRef">
      <div ref="listRef" v-infinite-scroll="getAccountList" :infinite-scroll-distance="600" :infinite-scroll-immediate="false">
        <template v-for="item in displayAccounts" :key="item.accountId">
        <div class="domain-group" v-if="groupStarts.has(item.accountId)">
          <span class="domain-dot" :style="{background: domainColor(domainOf(item.email))}"></span>
          {{ domainOf(item.email) }}
          <span class="domain-count">{{ domainCounts[domainOf(item.email)] }}</span>
        </div>
        <el-card class="item" :class="[itemBg(item.accountId), isMain(item) ? 'item-main' : '', canDrag ? 'item-drag' : '']"
                 :style="{'--domain-color': domainColor(domainOf(item.email))}"
                 @click="changeAccount(item)">
          <div class="account">
            {{ item.email }}
            <span class="unread-count" v-if="notifyStore.unreadAccounts[item.accountId]">{{ notifyStore.unreadAccounts[item.accountId] > 99 ? '99+' : notifyStore.unreadAccounts[item.accountId] }}</span>
          </div>
          <div class="opt">
            <div class="send-email" @click.stop>
              <Icon @click="setAllReceive(item)" v-if="!item.allReceive" icon="eva:email-fill" width="22" height="22" color="#fccb1a"/>
              <Icon @click="setAllReceive(item)" v-else icon="flat-color-icons:folder" width="22" height="22" color="#23c4f1" />
            </div>
            <div class="settings" @click.stop>
              <Icon icon="fluent-color:clipboard-24" width="22" height="22" @click.stop="copyAccount(item.email)"/>
              <Icon icon="fluent:settings-24-filled" width="21" height="21" color="#909399"
                    v-if="showNullSetting(item)"/>
              <el-dropdown v-else>
                <Icon icon="fluent:settings-24-filled" width="21" height="21" color="#909399"/>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="hasPerm('email:send')" @click="openSetName(item)">{{ $t('rename') }}</el-dropdown-item>
                    <el-dropdown-item v-if="item.accountId !== userStore.user.account.accountId" @click="setAsTop(item)">{{ $t('pin') }}</el-dropdown-item>
                    <el-dropdown-item v-if="item.accountId !== userStore.user.account.accountId && hasPerm('account:delete')"
                                      @click="remove(item)">{{ $t('delete') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-card>
        </template>

        <!-- Initial Loading Skeleton -->
        <template v-if="loading">
          <el-skeleton v-for="i in skeletonRows" :key="i" animated>
            <template #template>
              <el-card class="item">
                <el-skeleton-item variant="p" style="width: 70%; height: 20px; margin-bottom: 25px"/>
                <div style="display: flex; justify-content: space-between">
                  <el-skeleton-item variant="text" style="width: 20px"/>
                  <el-skeleton-item variant="text" style="width: 20px"/>
                </div>
              </el-card>
            </template>
          </el-skeleton>
        </template>

        <!-- Follow Loading Skeleton -->
        <template v-if="accounts.length > 0 && !noLoading">
          <el-skeleton animated>
            <template #template>
              <el-card class="item">
                <el-skeleton-item variant="p" style="width: 70%; height: 20px; margin-bottom: 20px"/>
                <div style="display: flex; justify-content: space-between">
                  <el-skeleton-item variant="text" style="width: 20px"/>
                  <el-skeleton-item variant="text" style="width: 20px"/>
                </div>
              </el-card>
            </template>
          </el-skeleton>
        </template>

        <div class="noLoading" v-if="noLoading && accounts.length > 0">
          <div>{{ $t('noMoreData') }}</div>
        </div>
        <div class="empty" v-if="noLoading && accounts.length === 0">
          <el-empty :description="$t('noMessagesFound')"/>
        </div>
      </div>

    </el-scrollbar>
    <el-dialog v-model="colorShow" :title="$t('domainColors')" width="360">
      <div class="color-list">
        <div class="color-row" v-for="d in domainOptions" :key="d.domain">
          <el-color-picker v-model="colorDraft[d.domain]" :predefine="DOMAIN_COLORS" size="small"/>
          <span class="color-domain">{{ d.domain }}</span>
          <span class="domain-count">{{ d.count }}</span>
          <Icon v-if="customColors[d.domain] || colorDraft[d.domain] !== defaultColor(d.domain)"
                class="icon color-reset" icon="mdi:restore" width="16" height="16"
                :title="$t('reset')" @click="colorDraft[d.domain] = defaultColor(d.domain)"/>
        </div>
      </div>
      <template #footer>
        <el-button @click="colorShow = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" :loading="colorSaving" @click="saveColors">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="showAdd" :title="$t('addAccount')">
      <div class="container">
        <el-input v-model="addForm.email" ref="addRef" type="text" :placeholder="$t('emailAccount')" autocomplete="off">
          <template #append>
            <div @click.stop="openSelect">
              <el-select
                  ref="mySelect"
                  v-model="addForm.suffix"
                  :placeholder="$t('select')"
                  class="select"
              >
                <el-option
                    v-for="item in domainList"
                    :key="item"
                    :label="item"
                    :value="item"
                />
              </el-select>
              <div>
                <span>{{ addForm.suffix }}</span>
                <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
              </div>
            </div>
          </template>
        </el-input>
        <el-button class="btn" type="primary" @click="submit" :loading="addLoading"
        >{{ $t('add') }}
        </el-button>
      </div>
      <div
          class="add-email-turnstile"
          :class="verifyShow ? 'turnstile-show' : 'turnstile-hide'"
          :data-sitekey="settingStore.settings.siteKey"
          data-callback="onTurnstileSuccess"
          data-error-callback="onTurnstileError"
      >
        <span style="font-size: 12px;color: #F56C6C" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
      </div>
    </el-dialog>
    <el-dialog v-model="setNameShow" :title="$t('changeUserName')">
      <div class="container">
        <el-input v-model="accountName" type="text" :placeholder="$t('username')" autocomplete="off">
        </el-input>
        <el-button class="btn" type="primary" @click="setName" :loading="setNameLoading"
        >{{ $t('save') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import {Icon} from "@iconify/vue";
import {useNotifyStore} from "@/store/notify.js";
const notifyStore = useNotifyStore();
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import {
  accountList,
  accountAdd,
  accountDelete,
  accountSetName,
  accountSetAllReceive,
  accountSetAsTop,
  accountListAll,
  accountSetSort
} from "@/request/account.js";
import Sortable from 'sortablejs'
import {getDomainColors, saveDomainColors} from "@/request/my.js";
import {sleep} from "@/utils/time-utils.js"
import {isEmail} from "@/utils/verify-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {useUserStore} from "@/store/user.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {AccountAllReceiveEnum} from "@/enums/account-enum.js";
import { useClipboard } from '@/composables/useClipboard.js'
const { copy } = useClipboard()

const {t} = useI18n();
const userStore = useUserStore();
const accountStore = useAccountStore();
const settingStore = useSettingStore();
const emailStore = useEmailStore();
const showAdd = ref(false)
const addLoading = ref(false);
const domainList = computed(() => settingStore.domainList)
const accounts = reactive([])
const noLoading = ref(false)
const loading = ref(false)
const followLoading = ref(false);
const verifyShow = ref(false)
const setNameShow = ref(false)
const setNameLoading = ref(false)
const accountName = ref(null)
const addRef = ref({})
const scrollbarRef = ref({})
let account = null
let turnstileId = null
const botJsError = ref(false)
let verifyToken = ''
let verifyErrorCount = 0
let first = true
const addForm = reactive({
  email: '',
  suffix: settingStore.domainList[0]
})
let skeletonRows = 10
const queryParams = {
  size: 30
}

const mySelect = ref()

if (hasPerm('account:query')) {
  getAccountList()
}

watch(() => accountStore.changeUserAccountName, () => {
  accounts[0].name = accountStore.changeUserAccountName
})

watch(() => settingStore.domainList, (list) => {
  if (!addForm.suffix && list.length > 0) {
    addForm.suffix = list[0]
  }
}, {immediate: true})


const openSelect = () => {
  mySelect.value.toggleMenu()
}

window.onTurnstileError = (e) => {
  if (verifyErrorCount >= 4) {
    return
  }
  verifyErrorCount++
      console.warn('Captcha load failed', e)
  setTimeout(() => {
    nextTick(() => {
      if (!turnstileId) {
        turnstileId = window.turnstile.render('.add-email-turnstile')
      } else {
        window.turnstile.reset(turnstileId);
      }
    })
  }, 1500)
};

window.onTurnstileSuccess = (token) => {
  verifyToken = token;
};

function getSkeletonRows() {
  if (accounts.length > 20) return skeletonRows = 20
  if (accounts.length === 0) return skeletonRows = 1
  skeletonRows = accounts.length
}

function setName() {

  let name = accountName.value

  if (name === account.name) {
    setNameShow.value = false
    return
  }

  if (!name) {
    ElMessage({
      message: t('emptyUserNameMsg'),
      type: 'error',
      plain: true,
    })
    return;
  }

  setNameLoading.value = true
  accountSetName(account.accountId, name).then(() => {
    account.name = name
    setNameShow.value = false

    if (account.accountId === userStore.user.account.accountId) {
      userStore.user.name = name
    }

    ElMessage({
      message: t('saveSuccessMsg'),
      type: "success",
      plain: true
    })
  }).finally(() => {
    setNameLoading.value = false
  })
}

function openSetName(accountItem) {
  accountName.value = accountItem.name
  account = accountItem
  setNameShow.value = true
}

function setAllReceive(account) {
  let allReceiveAccount = accounts.find(account => account.allReceive === AccountAllReceiveEnum.ENABLED);
  if (allReceiveAccount && allReceiveAccount.accountId !== account.accountId) allReceiveAccount.allReceive = AccountAllReceiveEnum.DISABLED;
  account.allReceive = account.allReceive === AccountAllReceiveEnum.DISABLED ? AccountAllReceiveEnum.ENABLED : AccountAllReceiveEnum.DISABLED;
  accountSetAllReceive(account.accountId).catch(() => {
    account.allReceive = account.allReceive === AccountAllReceiveEnum.DISABLED ? AccountAllReceiveEnum.ENABLED : AccountAllReceiveEnum.DISABLED;
    if (allReceiveAccount) allReceiveAccount.allReceive = AccountAllReceiveEnum.ENABLED;
  }).then(() => {
    if (account.allReceive === AccountAllReceiveEnum.ENABLED) {
      ElMessage({
        message: t('setSuccess'),
        type: 'success',
        plain: true,
      })
    }
    changeAccount(account);
    emailStore.emailScroll?.refreshList();
    emailStore.sendScroll?.refreshList();
  })
}


function showNullSetting(item) {
  return !hasPerm('email:send') && !(item.accountId !== userStore.user.account.accountId && hasPerm('account:delete'))
}

function itemBg(accountId) {
  return accountStore.currentAccountId === accountId ? 'item-choose' : ''
}



function remove(account) {
  ElMessageBox.confirm(t('delConfirm', {msg: account.email}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    accountDelete(account.accountId).then(() => {
      const index = accounts.findIndex(item => item.accountId === account.accountId);
      accounts.splice(index, 1);
      if (accounts.length < queryParams.size) {
        getAccountList()
      }
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
    })
  });
}

function refresh() {
  if (loading.value) {
    return
  }
  loading.value = false
  followLoading.value = false
  noLoading.value = false
  queryParams.accountId = 0
  queryParams.lastSort = null
  getSkeletonRows();
  scrollbarRef.value.setScrollTop(0)
  accounts.splice(0, accounts.length)
  getAccountList()
}

function changeAccount(account) {
  accountStore.currentAccountId = account.accountId
  accountStore.currentAccount = account
}

function add() {
  addForm.suffix = addForm.suffix || settingStore.domainList[0]
  showAdd.value = true
  setTimeout(() => {
    addRef.value.focus()
  }, 100)
}

function setAsTop(account) {
  const index = accounts.findIndex(item => item.accountId === account.accountId)
  accountSetAsTop(account.accountId).then(() => {
    ElMessage({
      message: t('setSuccess'),
      type: 'success',
      plain: true,
    })

    const [item] = accounts.splice(index, 1);
    accounts.splice(1, 0, item);

  });
}

async function copyAccount(account) {
  await copy(account)
}

function domainOf(email = '') {
  return email.split('@')[1]?.toLowerCase() || ''
}

// Ant-style palette matching the app; each domain gets its own slot
const DOMAIN_COLORS = ['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#13c2c2', '#eb2f96', '#2f54eb', '#faad14', '#a0d911', '#fa541c']

// Configured domains keep a fixed order so their colors never shift;
// domains outside the config follow alphabetically
const domainIndex = computed(() => {
  const ordered = settingStore.domainList.map(d => d.replace(/^@/, '').toLowerCase())
  const extra = Object.keys(domainCounts.value).filter(d => !ordered.includes(d)).sort()
  const map = {}
  ;[...ordered, ...extra].forEach((d, i) => { if (!(d in map)) map[d] = Object.keys(map).length })
  return map
})

function defaultColor(domain) {
  const i = domainIndex.value[domain] ?? 0
  return DOMAIN_COLORS[i % DOMAIN_COLORS.length]
}

// User-chosen colors (saved per user on the server) override the defaults
const customColors = ref({})
const colorShow = ref(false)
const colorSaving = ref(false)
const colorDraft = reactive({})

function domainColor(domain) {
  return customColors.value[domain] || defaultColor(domain)
}

getDomainColors().then(colors => { customColors.value = colors || {} }).catch(() => {})

async function openColors() {
  await ensureAll()
  for (const k of Object.keys(colorDraft)) delete colorDraft[k]
  for (const {domain} of domainOptions.value) colorDraft[domain] = domainColor(domain)
  colorShow.value = true
}

function saveColors() {
  const colors = {}
  for (const [domain, color] of Object.entries(colorDraft)) {
    if (color && color.toLowerCase() !== defaultColor(domain)) colors[domain] = color.toLowerCase()
  }
  colorSaving.value = true
  saveDomainColors(colors).then(saved => {
    customColors.value = saved
    colorShow.value = false
    ElMessage({message: t('saveSuccessMsg'), type: 'success', plain: true})
  }).finally(() => {
    colorSaving.value = false
  })
}

const domainFilter = ref('')

const sortOptions = computed(() => [
  {value: 'default', label: t('sortDefault')},
  {value: 'domain', label: t('sortDomain')},
  {value: 'email', label: t('sortEmail')},
  {value: 'unread', label: t('sortUnread')},
  {value: 'newest', label: t('sortNewest')},
])

const domainCounts = computed(() => {
  const counts = {}
  for (const a of accounts) {
    const d = domainOf(a.email)
    counts[d] = (counts[d] || 0) + 1
  }
  return counts
})

const domainOptions = computed(() => Object.entries(domainCounts.value)
    .map(([domain, count]) => ({domain, count}))
    .sort((a, b) => a.domain.localeCompare(b.domain)))

const displayAccounts = computed(() => {
  const sortBy = accountStore.sortBy
  let list = accounts.filter(a => !domainFilter.value || domainOf(a.email) === domainFilter.value)

  if (sortBy !== 'default') {
    const mainId = userStore.user.account?.accountId
    const main = list.filter(a => a.accountId === mainId)
    const rest = list.filter(a => a.accountId !== mainId)
    const unread = notifyStore.unreadAccounts
    const byEmail = (a, b) => a.email.localeCompare(b.email)
    const compare = {
      email: byEmail,
      domain: (a, b) => domainOf(a.email).localeCompare(domainOf(b.email)) || byEmail(a, b),
      unread: (a, b) => (unread[b.accountId] || 0) - (unread[a.accountId] || 0) || byEmail(a, b),
      newest: (a, b) => b.accountId - a.accountId,
    }[sortBy]
    list = [...main, ...rest.sort(compare)]
  }

  return list
})

// Accounts that open a new domain section when sorted by domain
const groupStarts = computed(() => {
  const ids = new Set()
  if (accountStore.sortBy !== 'domain' || domainFilter.value) return ids
  const mainId = userStore.user.account?.accountId
  let prev = null
  for (const a of displayAccounts.value) {
    if (a.accountId === mainId) continue
    const d = domainOf(a.email)
    if (d !== prev) ids.add(a.accountId)
    prev = d
  }
  return ids
})

let loadingAll = null

// Sorting and filtering need every account, not just the loaded page
function ensureAll() {
  if (noLoading.value) return Promise.resolve()
  if (loadingAll) return loadingAll
  loadingAll = accountListAll().then(list => {
    accounts.splice(0, accounts.length, ...list)
    noLoading.value = true
  }).finally(() => {
    loadingAll = null
  })
  return loadingAll
}

function changeSort(value) {
  accountStore.sortBy = value
  if (value !== 'default') ensureAll()
}

watch(domainFilter, v => v && ensureAll())

// Manual order: drag cards in "manual" mode; the main account stays pinned on top
const listRef = ref(null)
const canDrag = computed(() => accountStore.sortBy === 'default' && !domainFilter.value)
let sortable = null

function isMain(account) {
  return account.accountId === userStore.user.account?.accountId
}

function onDragEnd(evt) {
  const {item, from, oldIndex, newIndex, oldDraggableIndex, newDraggableIndex} = evt
  if (oldIndex === newIndex) return

  // Put the DOM back where Vue expects it, then reorder the data
  from.insertBefore(item, from.children[oldIndex + (oldIndex > newIndex ? 1 : 0)] || null)

  const [moved] = accounts.splice(oldDraggableIndex, 1)
  accounts.splice(newDraggableIndex, 0, moved)

  const ids = accounts.filter(a => !isMain(a)).map(a => a.accountId)
  accounts.forEach((a, i) => { a.sort = accounts.length - i })
  accountSetSort(ids).catch(() => refresh())
}

function setupSortable() {
  if (!listRef.value || sortable) return
  sortable = Sortable.create(listRef.value, {
    draggable: '.item',
    filter: '.item-main, .settings, .send-email',
    preventOnFilter: false,
    animation: 150,
    delay: 200,
    delayOnTouchOnly: true,
    ghostClass: 'item-ghost',
    onMove: evt => !evt.related.classList.contains('item-main'),
    onEnd: onDragEnd,
  })
}

watch(canDrag, async on => {
  if (on) {
    await ensureAll()
    await nextTick()
    setupSortable()
    sortable?.option('disabled', false)
  } else {
    sortable?.option('disabled', true)
  }
})

onMounted(async () => {
  if (canDrag.value && hasPerm('account:query')) {
    await nextTick()
    setupSortable()
  }
})

onBeforeUnmount(() => sortable?.destroy())

function getAccountList() {

  // Load every account up front: sorting, filtering and dragging all need the full list
  if (accounts.length === 0) {
    if (loading.value) return
    loading.value = true
    accountListAll().then(list => {
      accounts.push(...list)
      accountStore.currentAccount = list[0]
      noLoading.value = true
      first = false
    }).finally(() => {
      loading.value = false
    })
    return
  }

  if (loading.value || followLoading.value || noLoading.value) return;

  if (accounts.length === 0) {
    loading.value = true
  } else {
    followLoading.value = true
  }

  let start = Date.now();

  const accountId = accounts.length > 0 ? accounts.at(-1).accountId : 0;
  const lastSort = accounts.length > 0 ? accounts.at(-1).sort : null;

  accountList(accountId, queryParams.size, lastSort).then(async list => {

    let end = Date.now();
    let duration = end - start;
    if (duration < 300) {
      await sleep(300 - duration)
    }

    if (list.length < queryParams.size) {
      noLoading.value = true
    }
    if (accounts.length === 0) {
      accountStore.currentAccount = list[0]
    }

    accounts.push(...list)

    loading.value = false
    followLoading.value = false
    first = false
  }).catch(() => {
    loading.value = false
    followLoading.value = false
  })
}


function submit() {

  if (!addForm.email) {
    ElMessage({
      message: t('emptyEmailMsg'),
      type: "error",
      plain: true
    })
    return
  }

  if (addForm.email.length < settingStore.settings.minEmailPrefix) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!isEmail(addForm.email + addForm.suffix)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: "error",
      plain: true
    })
    return
  }

  if (!verifyToken && (settingStore.settings.addEmailVerify === 0 || (settingStore.settings.addEmailVerify === 2 && settingStore.settings.addVerifyOpen))) {
    if (!verifyShow.value) {
      verifyShow.value = true
      nextTick(() => {
        if (!turnstileId) {
          try {
            turnstileId = window.turnstile.render('.add-email-turnstile')
          } catch (e) {
            botJsError.value = true
            console.log('Captcha JS failed to load')
          }
        } else {
          window.turnstile.reset('.add-email-turnstile')
        }
      })
    } else if (!botJsError.value) {
      ElMessage({
        message: t('botVerifyMsg'),
        type: "error",
        plain: true
      })
    }
    return;
  }

  addLoading.value = true
  accountAdd(addForm.email + addForm.suffix, verifyToken).then(account => {
    addLoading.value = false
    showAdd.value = false
    addForm.email = ''
    accounts.push(account)
    verifyToken = ''
    settingStore.settings.addVerifyOpen = account.addVerifyOpen
    ElMessage({
      message: t('addSuccessMsg'),
      type: "success",
      plain: true
    })
    verifyShow.value = false
    userStore.refreshUserInfo()
  }).catch(res => {
    if (res.code === 400) {
      verifyToken = ''
      if (turnstileId) {
        window.turnstile.reset(turnstileId)
      } else {
        nextTick(() => {
          turnstileId = window.turnstile.render('.add-email-turnstile')
        })
      }
      verifyShow.value = true
    }
    addLoading.value = false
  })
}
</script>
<style>
.domain-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}

.domain-count {
  float: right;
  margin-left: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.sort-chosen {
  color: var(--el-color-primary) !important;
  font-weight: bold;
}

path[fill="#ffdda1"] {
  fill: #ffdd7d;
}
</style>
<style scoped lang="scss">
.account-box {

  border-right: 1px solid var(--el-border-color) !important;
  background-color: var(--el-bg-color);
  height: 100%;
  overflow: hidden;

  .head-opt {
    display: flex;
    align-items: center;
    height: 38px;
    box-shadow: var(--header-actions-border);
    padding-left: 10px;
    padding-right: 10px;

    .icon {
      cursor: pointer;
    }

    .refresh {
      margin-left: 10px;
    }

    .add {
      margin-left: 2px;
    }

    .head-opt:not(.add) .refresh {
      margin-left: 5px;
    }
  }

  .scrollbar {
    width: 100%;
    height: calc(100% - 38px);
    overflow: auto;
    @media (max-width: 767px) {
      height: calc(100% - 98px);
    }

    .empty {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .noLoading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px 0;
      color: var(--secondary-text-color);
    }
  }

  .btn {
    width: 100%;
    margin-top: 15px;
  }

  .item {
    background-color: var(--el-bg-color);
    border-radius: 8px;
    padding: 12px 10px;
    margin-bottom: 10px;
    margin-left: 10px;
    margin-right: 10px;
    cursor: pointer;

    .account {
      font-weight: 600;
      margin-bottom: 20px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .opt {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #888;

      .settings {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .send-email {
        display: flex;
        align-items: center;
      }
    }

    :deep(.el-card__body) {
      padding: 0;
    }
  }

  .item:first-child {
    margin-top: 10px;
  }

  .item-choose {
    background: var(--choose-account-background);
  }
}


.setting-icon {
  position: relative;
  top: 6px;
}

:deep(.el-input-group__append) {
  padding: 0 !important;
  padding-left: 8px !important;
  background: var(--el-bg-color);
}

:deep(.el-dialog) {
  width: 400px !important;
  @media (max-width: 440px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.select {
  position: absolute;
  right: 30px;
  width: 100px;
  opacity: 0;
  pointer-events: none;
}

:deep(.el-pagination .el-select) {
  width: 100px;
  background: var(--el-bg-color);
}

.add-email-turnstile {
  margin-top: 15px;
}

.turnstile-show {
  opacity: 1;
}

.turnstile-hide {
  opacity: 0;
  pointer-events: none;
  position: fixed;
}

.unread-count {
  display: inline-block;
  margin-left: 6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #f56c6c;
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  line-height: 18px;
  text-align: center;
  vertical-align: middle;
  box-sizing: border-box;
}

.list-tools {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 10px;

  .domain-filter {
    width: 130px;
  }

  .sort-active {
    color: var(--el-color-primary);
  }
}

.item {
  border-left: 3px solid var(--domain-color) !important;
}


.domain-group {
  display: flex;
  align-items: center;
  margin: 14px 12px 8px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--el-text-color-secondary);

  .domain-count {
    float: none;
    margin-left: 6px;
  }
}

.item-drag:not(.item-main) {
  cursor: grab;
}

.item-ghost {
  opacity: .4;
}

.color-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 50vh;
  overflow-y: auto;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;

  .color-domain {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .domain-count {
    float: none;
    margin-left: 0;
  }

  .color-reset {
    cursor: pointer;
    color: var(--el-text-color-secondary);
  }
}
</style>
