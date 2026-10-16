<template>
  <div class="preview">
    <div class="preview-bar">
      <span class="bar-btn" role="button" tabindex="0" :title="$t('openFull')" :aria-label="$t('openFull')"
            @click="$emit('open', email)" @keydown.enter="$emit('open', email)">
        <Icon icon="lucide:maximize-2" width="17" height="17"/>
      </span>
      <span class="bar-gap"></span>
      <span v-if="canReply" v-perm="'email:send'" class="bar-btn" role="button" tabindex="0" :title="$t('reply')" :aria-label="$t('reply')"
            @click="$emit('reply', email)" @keydown.enter="$emit('reply', email)">
        <Icon icon="lucide:reply" width="18" height="18"/>
      </span>
      <span v-if="canForward" v-perm="'email:send'" class="bar-btn" role="button" tabindex="0" :title="$t('forward')" :aria-label="$t('forward')"
            @click="$emit('forward', email)" @keydown.enter="$emit('forward', email)">
        <Icon icon="lucide:forward" width="18" height="18"/>
      </span>
      <span v-if="canStar" class="bar-btn" role="button" tabindex="0" :title="$t('star')" :aria-label="$t('star')"
            @click="$emit('star', email)" @keydown.enter="$emit('star', email)">
        <Icon v-if="email.isStar" icon="fluent-color:star-16" width="19" height="19"/>
        <Icon v-else icon="lucide:star" width="18" height="18"/>
      </span>
      <span v-perm="'email:delete'" class="bar-btn" role="button" tabindex="0" :title="$t('delete')" :aria-label="$t('delete')"
            @click="$emit('delete', email)" @keydown.enter="$emit('delete', email)">
        <Icon icon="lucide:trash-2" width="17" height="17"/>
      </span>
    </div>
    <el-scrollbar class="preview-scroll">
      <div class="preview-body" :key="email.emailId">
        <h2 class="subject">{{ email.subject || '​' }}</h2>
        <div class="meta">
          <div class="meta-row">
            <span class="meta-label">{{ $t('from') }}</span>
            <span class="meta-value"><b>{{ email.name }}</b> &lt;{{ email.sendEmail }}&gt;</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">{{ $t('recipient') }}</span>
            <span class="meta-value">{{ recipients }}</span>
          </div>
          <div class="meta-row date">{{ formatDetailDate(email.createTime) }}</div>
        </div>
        <el-alert v-if="email.status === 3" :closable="false" :title="failMessage" class="alert" type="error" show-icon/>
        <el-alert v-if="email.status === 4" :closable="false" :title="$t('complained')" class="alert" type="warning" show-icon/>
        <el-alert v-if="email.status === 5" :closable="false" :title="$t('delayed')" class="alert" type="warning" show-icon/>
        <div class="mail-content">
          <ShadowHtml v-if="email.content" :html="formatImage(email.content)"/>
          <pre v-else class="plain" v-html="linkify(email.text)"></pre>
        </div>
        <div class="att" v-if="email.attList && email.attList.length > 0">
          <div class="att-title">
            <span>{{ $t('attachments') }}</span>
            <span>{{ $t('attCount', {total: email.attList.length}) }}</span>
          </div>
          <div class="att-item" v-for="att in email.attList" :key="att.attId">
            <Icon class="att-type" v-bind="getIconByName(att.filename)"/>
            <span class="att-name" @click="showImage(att.key, att.filename)">{{ att.filename }}</span>
            <span class="att-size">{{ formatBytes(att.size) }}</span>
            <a :href="cvtR2Url(att.key)" download :title="$t('download')" :aria-label="$t('download')">
              <Icon icon="lucide:download" width="17" height="17"/>
            </a>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <el-image-viewer v-if="viewerShow" :url-list="srcList" show-progress @close="viewerShow = false"/>
  </div>
</template>

<script setup>
import {computed, reactive, ref} from "vue";
import {Icon} from "@iconify/vue";
import ShadowHtml from '@/components/shadow-html/index.vue'
import {linkify} from '@/utils/linkify.js'
import {formatDetailDate} from "@/utils/day.js";
import {getExtName, formatBytes} from "@/utils/file-utils.js";
import {cvtR2Url, toOssDomain} from "@/utils/convert.js";
import {getIconByName} from "@/utils/icon-utils.js";
import {useSettingStore} from "@/store/setting.js";

const props = defineProps({
  email: {type: Object, required: true},
  canReply: {type: Boolean, default: true},
  canForward: {type: Boolean, default: true},
  canStar: {type: Boolean, default: true}
})

defineEmits(['open', 'reply', 'forward', 'star', 'delete'])

const settingStore = useSettingStore()
const viewerShow = ref(false)
const srcList = reactive([])

const recipients = computed(() => {
  try {
    return JSON.parse(props.email.recipient).map(item => item.address).join(', ')
  } catch (e) {
    return props.email.toEmail || ''
  }
})

const failMessage = computed(() => {
  try {
    return props.email.message ? JSON.parse(props.email.message).message : ''
  } catch (e) {
    return ''
  }
})

function formatImage(content) {
  const domain = settingStore.settings.r2Domain
  return (content || '').replace(/{{domain}}/g, toOssDomain(domain) + '/')
}

function isImage(filename) {
  return ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'jfif'].includes(getExtName(filename))
}

function showImage(key, filename) {
  if (!isImage(filename)) return
  srcList.length = 0
  srcList.push(cvtR2Url(key))
  viewerShow.value = true
}
</script>

<style scoped lang="scss">
.preview {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  background: var(--el-bg-color);
  overflow: hidden;
}

.preview-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 5px 10px;
  box-shadow: var(--header-actions-border);
  color: var(--el-text-color-regular);
}

.bar-gap {
  flex: 1;
}

.bar-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color .15s, color .15s;

  &:hover, &:focus-visible {
    background: var(--el-fill-color);
    color: var(--el-text-color-primary);
  }
}

.preview-scroll {
  min-height: 0;
}

.preview-body {
  padding: 18px 22px 28px;
  font-size: 14px;
  min-width: 0;
}

.subject {
  margin: 0 0 12px;
  font-size: 19px;
  line-height: 1.35;
  word-break: break-word;
}

.meta {
  padding-bottom: 10px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: grid;
  gap: 4px;
}

.meta-row {
  display: flex;
  gap: 10px;
  min-width: 0;

  &.date {
    color: var(--el-text-color-secondary);
  }
}

.meta-label {
  flex: 0 0 auto;
  font-weight: 600;
}

.meta-value {
  min-width: 0;
  word-break: break-word;
  color: var(--el-text-color-regular);

  b {
    color: var(--el-text-color-primary);
  }
}

.alert {
  margin-bottom: 14px;
}

.mail-content {
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--message-block-color);
    pointer-events: none;
  }
}

.plain {
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.att {
  margin-top: 24px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  display: grid;
  gap: 8px;
}

.att-title {
  display: flex;
  justify-content: space-between;
  font-weight: 600;

  span:last-child {
    font-weight: normal;
    color: var(--el-text-color-secondary);
  }
}

.att-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  min-width: 0;

  a {
    display: inline-flex;
    color: var(--el-text-color-secondary);

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.att-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
}

.att-size {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
