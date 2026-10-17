<template>
  <div class="box">
    <section class="section">
      <h2 class="title">{{$t('profile')}}</h2>
      <div class="card">
        <div class="row">
          <div class="label">{{$t('username')}}</div>
          <div class="control">
            <span v-if="setNameShow" class="edit-name-box">
              <el-input v-model="accountName" @keyup.enter="setName"></el-input>
              <el-button type="primary" @click="setName">{{$t('save')}}</el-button>
            </span>
            <span v-else class="user-name">
              <span class="name-text">{{ userStore.user.name }}</span>
              <span class="edit-name" @click="showSetName">{{$t('change')}}</span>
            </span>
          </div>
        </div>
        <div class="row">
          <div class="label">{{$t('emailAccount')}}</div>
          <div class="control value">{{ userStore.user.email }}</div>
        </div>
        <div class="row">
          <div class="label">{{$t('password')}}</div>
          <div class="control">
            <el-button type="primary" @click="pwdShow = true">{{$t('changePwdBtn')}}</el-button>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="title">{{$t('language')}}</h2>
      <div class="card">
        <div class="row">
          <div class="label">{{$t('language')}}</div>
          <div class="control">
            <el-select :model-value="langSelect" class="language-select" placeholder="Select" @change="changeLang">
              <el-option label="中文" value="zh" @pointerdown.prevent.stop="changeLang('zh')"/>
              <el-option label="English" value="en" @pointerdown.prevent.stop="changeLang('en')"/>
              <el-option label="Indonesia" value="id" @pointerdown.prevent.stop="changeLang('id')"/>
            </el-select>
          </div>
        </div>
      </div>
    </section>

    <section class="section notify">
      <h2 class="title">{{$t('newEmailNotify')}}</h2>
      <div class="card">
        <div class="row">
          <div class="label">
            <div>{{$t('desktopNotify')}}</div>
            <div class="desc">{{$t('desktopNotifyDesc')}}</div>
          </div>
          <div class="control"><el-switch :model-value="notifyStore.desktop" @change="changeDesktop"/></div>
        </div>
        <div class="row">
          <div class="label">{{$t('notifySound')}}</div>
          <div class="control"><el-switch v-model="notifyStore.sound"/></div>
        </div>
      </div>
    </section>

    <section class="section notify">
      <h2 class="title">{{$t('privacy')}}</h2>
      <div class="card">
        <div class="row">
          <div class="label">
            <div>{{$t('blockImages')}}</div>
            <div class="desc">{{$t('blockImagesDesc')}}</div>
          </div>
          <div class="control"><el-switch v-model="uiStore.blockRemoteImages"/></div>
        </div>
      </div>
    </section>

    <section class="section danger del-email" v-perm="'my:delete'">
      <h2 class="title">{{$t('deleteUser')}}</h2>
      <div class="card">
        <div class="row">
          <div class="label">
            <div class="desc">{{$t('delAccountMsg')}}</div>
          </div>
          <div class="control">
            <el-button type="danger" @click="deleteConfirm">{{$t('deleteUserBtn')}}</el-button>
          </div>
        </div>
      </div>
    </section>
    <el-dialog v-model="pwdShow" :title="$t('changePassword')" width="340">
      <div class="update-pwd">
        <el-input type="password" :placeholder="$t('newPassword')" v-model="form.password" autocomplete="off"/>
        <el-input type="password" :placeholder="$t('confirmPassword')" v-model="form.newPwd" autocomplete="off"/>
        <el-button type="primary" :loading="setPwdLoading" @click="submitPwd">{{$t('save')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import {reactive, ref, defineOptions} from 'vue'
import {resetPassword, userDelete} from "@/request/my.js";
import {useUserStore} from "@/store/user.js";
import router from "@/router/index.js";
import {accountSetName} from "@/request/account.js";
import {useAccountStore} from "@/store/account.js";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/setting.js";
import {useNotifyStore} from "@/store/notify.js";
import {useUiStore} from "@/store/ui.js";

const { t } = useI18n()
const accountStore = useAccountStore()
const settingStore = useSettingStore()
const notifyStore = useNotifyStore()
const uiStore = useUiStore()
const userStore = useUserStore();
const setPwdLoading = ref(false)
const setNameShow = ref(false)
const accountName = ref(null)
const langSelect = ref(settingStore.lang)

defineOptions({
  name: 'setting'
})

function showSetName() {
  accountName.value = userStore.user.name
  setNameShow.value = true
}

function setName() {

  if (!accountName.value) {
    ElMessage({
      message: t('emptyUserNameMsg'),
      type: 'error',
      plain: true,
    })
    return;
  }

  setNameShow.value = false
  let name = accountName.value

  if (name === userStore.user.name) {
    return
  }

  userStore.user.name = accountName.value

  accountSetName(userStore.user.account.accountId,name).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })

    accountStore.changeUserAccountName = name

  }).catch(() => {
    userStore.user.name = name
  })
}

async function changeDesktop(value) {
  if (!value) {
    notifyStore.desktop = false
    return
  }
  if (!('Notification' in window)) return
  const permission = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission
  if (permission !== 'granted') {
    ElMessage({message: t('notifyBlocked'), type: 'warning', plain: true})
    return
  }
  notifyStore.desktop = true
}

function changeLang(lang) {
  let setting = {}
  try {
    setting = JSON.parse(localStorage.getItem('setting') || '{}')
  } catch (e) {
    setting = {}
  }
  localStorage.setItem('setting', JSON.stringify({...setting, lang}))
  window.location.reload()
}

const pwdShow = ref(false)
const form = reactive({
  password: '',
  newPwd: '',
})

const deleteConfirm = () => {
  ElMessageBox.confirm(t('delAccountConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    userDelete().then(() => {
      localStorage.removeItem('token');
      router.replace('/login');
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
    })
  })
}


function submitPwd() {

  if (!form.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password.length < 6) {
    ElMessage({
      message: t('pwdLengthMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password !== form.newPwd) {
    ElMessage({
      message: t('confirmPwdFailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  setPwdLoading.value = true
  resetPassword(form.password).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })
    pwdShow.value = false
    setPwdLoading.value = false
    form.password = ''
    form.newPwd = ''
  }).catch(() => {
    setPwdLoading.value = false
  })

}

</script>
<style scoped lang="scss">
.box {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  box-sizing: border-box;
  padding: 36px 24px 64px;

  @media (max-width: 767px) {
    padding: 24px 16px 48px;
  }

  .update-pwd {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .section {
    margin-bottom: 28px;
  }

  .title {
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 600;
  }

  .card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    background: var(--el-bg-color);
    font-size: 14px;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    min-height: 56px;
    padding: 12px 20px;

    & + .row {
      border-top: 1px solid var(--el-border-color-lighter);
    }

    @media (max-width: 767px) {
      padding: 12px 16px;
      gap: 12px;
    }
  }

  .label {
    min-width: 0;
    font-weight: 500;
  }

  .desc {
    margin-top: 2px;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--regular-text-color);
  }

  .control {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
    max-width: 60%;
  }

  .value {
    color: var(--regular-text-color);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: block;
  }

  .user-name {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;

    .name-text {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--regular-text-color);
    }
  }

  .edit-name {
    color: var(--el-color-primary);
    cursor: pointer;
    flex-shrink: 0;
  }

  .edit-name-box {
    display: flex;
    gap: 8px;

    .el-input {
      width: min(220px, calc(100vw - 220px));
    }
  }

  .language-select {
    width: 140px;
  }

  .danger .title {
    color: var(--el-color-danger);
  }
}
</style>
