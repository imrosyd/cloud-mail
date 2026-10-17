<template>
  <div class="aside-box" :class="{rail: rail}">
    <div class="brand" :title="settingStore.settings.title">
      <svg class="logo" viewBox="-0.4 -1.6 25 25" aria-hidden="true">
        <path fill="currentColor" d="M7 19.2a5 5 0 0 1-.9-9.9A6.4 6.4 0 0 1 18.5 8.9 5.2 5.2 0 0 1 17.7 19.2z"/>
      </svg>
      <span class="brand-name" v-if="!rail">{{ settingStore.settings.title }}</span>
    </div>

    <el-tooltip v-if="hasPerm('email:send')" placement="right" :disabled="!rail" :content="$t('composeEmail')" :show-after="150">
      <button type="button" class="compose-btn" :aria-label="$t('composeEmail')" @click="openCompose">
        <Icon icon="lucide:pen-line" width="20" height="20"/>
        <span class="compose-text" v-if="!rail">{{ $t('composeEmail') }}</span>
      </button>
    </el-tooltip>

    <el-scrollbar class="scroll">
      <el-menu :collapse="false" text-color="#fff" active-text-color="#fff">
        <el-tooltip v-for="item in mainItems" :key="item.name" placement="right" :disabled="!rail"
                    :content="$t(item.label)" :show-after="150">
          <el-menu-item :index="item.name" :class="route.meta.name === item.name ? 'choose-item' : ''"
                        @click="router.push({name: item.name})">
            <Icon class="menu-icon" :icon="item.icon" width="20" height="20"/>
            <span class="menu-name">{{ $t(item.label) }}</span>
            <span class="unread-badge" v-if="item.name === 'email' && notifyStore.unreadTotal > 0">{{ notifyStore.unreadTotal > 99 ? '99+' : notifyStore.unreadTotal }}</span>
          </el-menu-item>
        </el-tooltip>
        <div class="manage-title" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
          <div>{{ $t('manage') }}</div>
        </div>
        <el-tooltip v-for="item in manageItems" :key="item.name" placement="right" :disabled="!rail"
                    :content="$t(item.label)" :show-after="150">
          <el-menu-item :index="item.name" :class="route.meta.name === item.name ? 'choose-item' : ''"
                        @click="router.push({name: item.name})">
            <Icon class="menu-icon" :icon="item.icon" width="20" height="20"/>
            <span class="menu-name">{{ $t(item.label) }}</span>
          </el-menu-item>
        </el-tooltip>
      </el-menu>
    </el-scrollbar>

    <div class="aside-foot">
      <el-tooltip v-if="!isMobile" placement="right" :disabled="!rail" :content="$t('expandSidebar')" :show-after="150">
        <button type="button" class="foot-btn" :aria-label="rail ? $t('expandSidebar') : $t('collapseSidebar')"
                :aria-expanded="!rail" @click="uiStore.asideWide = !uiStore.asideWide">
          <Icon :icon="rail ? 'lucide:panel-left-open' : 'lucide:panel-left-close'" width="20" height="20"/>
          <span class="menu-name" v-if="!rail">{{ $t('collapseSidebar') }}</span>
        </button>
      </el-tooltip>
      <el-menu :collapse="false" text-color="#fff" active-text-color="#fff">
        <el-tooltip placement="right" :disabled="!rail" :content="$t(settingItem.label)" :show-after="150">
          <el-menu-item :index="settingItem.name" :class="route.meta.name === settingItem.name ? 'choose-item' : ''"
                        @click="router.push({name: settingItem.name})">
            <Icon class="menu-icon" :icon="settingItem.icon" width="20" height="20"/>
            <span class="menu-name">{{ $t(settingItem.label) }}</span>
          </el-menu-item>
        </el-tooltip>
      </el-menu>
    </div>
  </div>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import {Icon} from "@iconify/vue";
import {useSettingStore} from "@/store/setting.js";
import {useUiStore} from "@/store/ui.js";

import {computed} from "vue";
import {hasPerm} from "@/perm/perm.js";
import {useNotifyStore} from "@/store/notify.js";
import {useIsMobile} from "@/composables/useIsMobile.js";

const settingStore = useSettingStore();
const notifyStore = useNotifyStore();
const uiStore = useUiStore();
const route = useRoute();
const isMobile = useIsMobile();

// The narrow icon rail only exists on desktop; the mobile drawer always shows labels
const rail = computed(() => !isMobile.value && !uiStore.asideWide)

// One icon family and one slot size, so labels line up
const allMain = [
  {name: 'email', label: 'inbox', icon: 'lucide:inbox'},
  {name: 'send', label: 'sent', icon: 'lucide:send', perm: 'email:send'},
  {name: 'draft', label: 'drafts', icon: 'lucide:file-text', perm: 'email:send'},
  {name: 'star', label: 'starred', icon: 'lucide:star'},
  {name: 'trash', label: 'trash', icon: 'lucide:trash-2', perm: 'email:delete'},
]

const settingItem = {name: 'setting', label: 'settings', icon: 'lucide:settings'}

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

function openCompose() {
  uiStore.writerRef.open()
  // On the mobile drawer, get out of the way of the compose window
  if (isMobile.value) uiStore.asideShow = false
}
</script>

<style>
/* Light theme: a white sidebar with dark text; the dark theme keeps the values set on .aside-box */
html:not(.dark) .aside-box {
  --aside-fg: #4a5565;
  --aside-fg-strong: #1f2733;
  --aside-fg-dim: #8a93a2;
  --aside-line: #e6e9ee;
  --aside-hover: rgba(15, 40, 70, 0.06);
  --aside-focus: rgba(15, 40, 70, 0.1);
  --aside-icon-on: #1677d6;
  --aside-logo: #1890ff;
}
</style>

<style lang="scss" scoped>
.aside-box {
  --accent: #1890ff;
  // Colours for the dark sidebar; the light theme overrides them below
  --aside-fg: rgba(255, 255, 255, 0.78);
  --aside-fg-strong: #ffffff;
  --aside-fg-dim: rgba(255, 255, 255, 0.55);
  --aside-line: rgba(255, 255, 255, 0.1);
  --aside-hover: rgba(255, 255, 255, 0.08);
  --aside-focus: rgba(255, 255, 255, 0.13);
  --aside-icon-on: #4aa8ff;
  --aside-logo: #4aa8ff;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 260px;
  box-sizing: border-box;
  background: var(--aside-backgound);
  transition: width .18s ease;

  &.rail {
    width: 64px;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  margin: 14px 10px 8px;
  padding: 0 6px;
  color: var(--aside-fg-strong);
  font-size: 16px;
  font-weight: 700;
  overflow: hidden;

  .logo {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    color: var(--aside-logo);
  }

  .brand-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.rail .brand {
  padding: 0;
  justify-content: center;
}

.compose-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  margin: 0 10px 8px;
  border: 0;
  border-radius: 8px;
  color: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #1890ff, #3a80dd);
  box-shadow: 0 2px 8px rgba(24, 144, 255, .3);
  transition: filter .15s;

  &:hover {
    filter: brightness(1.08);
  }

  &:focus-visible {
    outline: none;
    filter: brightness(1.18);
  }
}

.rail .compose-btn {
  width: 44px;
  margin: 0 auto 8px;
}

.scroll {
  flex: 1;
  min-height: 0;
}

.aside-foot {
  flex-shrink: 0;
  padding-bottom: 10px;
}

.manage-title {
  margin: 14px 10px 4px;
  padding: 14px 10px 0;
  border-top: 1px solid var(--aside-line);
  color: var(--aside-fg-dim);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .6px;
  text-transform: uppercase;
}

.rail .manage-title {
  margin: 9px 16px;
  padding: 0;

  > div {
    display: none;
  }
}

.el-menu-item,
.foot-btn {
  margin: 3px 10px !important;
  border-radius: 8px;
  height: 40px;
  padding: 0 10px !important;
  gap: 12px;
  position: relative;
  color: var(--aside-fg) !important;
  transition: background-color .15s, color .15s;
}

.foot-btn {
  display: flex;
  align-items: center;
  width: calc(100% - 20px);
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
}

.menu-icon {
  flex-shrink: 0;
  width: 22px;
}

.choose-item {
  font-weight: 600;
  color: var(--aside-fg-strong) !important;
  // No fill: the current page is told apart by the edge mark, a white label and an accent-coloured icon
  background: transparent !important;
}

.choose-item .menu-icon {
  color: var(--aside-icon-on);
}

.choose-item::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 11px;
  bottom: 11px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--accent);
}

// Narrow rail: icon-only squares with room between them
.rail .el-menu-item,
.rail .foot-btn {
  width: 44px;
  height: 42px;
  margin: 0 auto 8px !important;
  padding: 0 !important;
  justify-content: center;
}

.rail .menu-name {
  display: none;
}

@media (hover: hover) {
  .el-menu-item:hover,
  .foot-btn:hover {
    background: var(--aside-hover) !important;
    color: var(--aside-fg-strong) !important;
  }
}

// Keyboard focus is a lighter fill instead of an outline
.el-menu-item:focus-visible,
.foot-btn:focus-visible {
  outline: none;
  background: var(--aside-focus) !important;
  color: var(--aside-fg-strong) !important;
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
  width: 100%;
}

.unread-badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  line-height: 20px;
  text-align: center;
  box-sizing: border-box;
}

.rail .unread-badge {
  position: absolute;
  top: 2px;
  right: 0;
  margin: 0;
  min-width: 17px;
  height: 17px;
  padding: 0 5px;
  font-size: 10.5px;
  line-height: 17px;
  box-shadow: 0 0 0 2px var(--aside-backgound);
}
</style>
