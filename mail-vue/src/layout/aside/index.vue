<template>
  <el-scrollbar class="scroll">
    <div>
      <div class="title" >
        <Icon icon="mdi:email-outline" width="24" height="24" />
        <div>{{settingStore.settings.title}}</div>
      </div>
      <el-menu :collapse="false" text-color="#fff" active-text-color="#fff" style="margin-top: 10px">
        <el-menu-item v-for="item in mainItems" :key="item.name" :index="item.name"
                      :class="route.meta.name === item.name ? 'choose-item' : ''"
                      @click="router.push({name: item.name})">
          <Icon class="menu-icon" :icon="item.icon" width="20" height="20" />
          <span class="menu-name">{{ $t(item.label) }}</span>
          <span class="unread-badge" v-if="item.name === 'email' && notifyStore.unreadTotal > 0">{{ notifyStore.unreadTotal > 99 ? '99+' : notifyStore.unreadTotal }}</span>
        </el-menu-item>
        <div class="manage-title" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
          <div>{{$t('manage')}}</div>
        </div>
        <el-menu-item v-for="item in manageItems" :key="item.name" :index="item.name"
                      :class="route.meta.name === item.name ? 'choose-item' : ''"
                      @click="router.push({name: item.name})">
          <Icon class="menu-icon" :icon="item.icon" width="20" height="20" />
          <span class="menu-name">{{ $t(item.label) }}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </el-scrollbar>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import {Icon} from "@iconify/vue";
import {useSettingStore} from "@/store/setting.js";

import {computed} from "vue";
import {hasPerm} from "@/perm/perm.js";
import {useNotifyStore} from "@/store/notify.js";

const settingStore = useSettingStore();
const notifyStore = useNotifyStore();
const route = useRoute();

// One icon family and one slot size, so labels line up
const allMain = [
  {name: 'email', label: 'inbox', icon: 'lucide:inbox'},
  {name: 'send', label: 'sent', icon: 'lucide:send', perm: 'email:send'},
  {name: 'draft', label: 'drafts', icon: 'lucide:file-text', perm: 'email:send'},
  {name: 'star', label: 'starred', icon: 'lucide:star'},
  {name: 'setting', label: 'settings', icon: 'lucide:settings'},
]

const allManage = [
  {name: 'analysis', label: 'analytics', icon: 'lucide:chart-pie', perm: 'analysis:query'},
  {name: 'user', label: 'allUsers', icon: 'lucide:users', perm: 'user:query'},
  {name: 'all-email', label: 'allMail', icon: 'lucide:mails', perm: 'all-email:query'},
  {name: 'role', label: 'permissions', icon: 'lucide:shield-check', perm: 'role:query'},
  {name: 'reg-key', label: 'inviteCode', icon: 'lucide:ticket', perm: 'reg-key:query'},
  {name: 'sys-setting', label: 'SystemSettings', icon: 'lucide:sliders-horizontal', perm: 'setting:query'},
]


// Items without a perm are open to everyone
const mainItems = computed(() => allMain.filter(item => !item.perm || hasPerm(item.perm)))
const manageItems = computed(() => allManage.filter(item => !item.perm || hasPerm(item.perm)))
</script>

<style lang="scss" scoped>

.title {
  margin: 15px 10px;
  height: 45px;
  border-radius: 6px;
  display: flex;
  position: relative;
  font-size: 16px;
  font-weight: bold;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #ffffff;
  background: linear-gradient(135deg, #1890ff, #3a80dd);
  transition: all 0.3s ease;
  max-width: 240px;
  padding: 0 10px;
  > div {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: calc(240px - 20px - 30px);
  }

  :deep(.el-icon) {
    flex-shrink: 0;
    font-size: 20px;
  }

  .user-right-icon {
    align-self: center;
    position: absolute;
    font-size: 12px;
    right: 8px;
    color: #ffffff;
  }

}


.manage-title {
  margin: 14px 10px 4px;
  padding: 14px 10px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .6px;
  text-transform: uppercase;
}

.el-menu-item {
  margin: 3px 10px !important;
  border-radius: 6px;
  height: 38px;
  padding: 0 10px !important;
  gap: 12px;
  position: relative;
  color: rgba(255, 255, 255, 0.78) !important;
  transition: background-color .15s, color .15s;
}

.menu-icon {
  flex-shrink: 0;
  width: 22px;
}

.choose-item {
  font-weight: 600;
  color: #fff !important;
  background: rgba(24, 144, 255, 0.18) !important;

  // Accent bar marks the current page
  &::before {
    content: '';
    position: absolute;
    left: -10px;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: #1890ff;
  }
}

@media (hover: hover) {
  .el-menu-item:hover {
    background: rgba(255, 255, 255, 0.08) !important;
    color: #fff !important;
  }
}

.menu-name {
  user-select: none;
}


:deep(.el-scrollbar__wrap--hidden-default ) {
  background: var(--aside-backgound) !important;
}

:deep(.el-menu-item) {
  background: var(--aside-backgound);
}

:deep(.el-menu) {
  background: var(--aside-backgound);
}

.el-menu {
  border-right: 0;
  width: 260px;
}

:deep(.el-divider__text) {
  background: var(--aside-backgound);
  color: #FFFFFF;
}

.scroll {

}
.unread-badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  line-height: 20px;
  text-align: center;
  box-sizing: border-box;
}
</style>
