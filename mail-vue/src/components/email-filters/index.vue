<template>
  <div class="email-filters">
    <el-input v-model="text" class="filter-search" clearable :placeholder="$t('inboxSearch')"
              :aria-label="$t('inboxSearch')" @keyup.enter="apply" @clear="apply">
      <template #prefix>
        <Icon icon="iconoir:search" width="16" height="16"/>
      </template>
    </el-input>
    <div class="filter-group" role="group" :aria-label="$t('filterLabel')">
      <button v-for="opt in options" :key="opt.value" type="button" class="filter-btn" :class="{on: view === opt.value}"
              :title="$t(opt.label)" :aria-label="$t(opt.label)" :aria-pressed="view === opt.value"
              @click="choose(opt.value)">
        <Icon :icon="opt.icon" width="18" height="18"/>
      </button>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
import {Icon} from "@iconify/vue";

const props = defineProps({
  showUnread: {type: Boolean, default: false}
})

const options = computed(() => [
  {value: 'all', icon: 'lucide:inbox', label: 'filterAll'},
  ...(props.showUnread ? [{value: 'unread', icon: 'lucide:mail', label: 'filterUnread'}] : []),
  {value: 'starred', icon: 'lucide:star', label: 'filterStarred'},
])

const emit = defineEmits(['change'])
const text = ref('')
const view = ref('all')

function choose(value) {
  if (view.value === value) return
  view.value = value
  apply()
}

function apply() {
  emit('change', {keyword: text.value.trim(), view: view.value})
}

function reset() {
  text.value = ''
  view.value = 'all'
  apply()
}

defineExpose({reset})
</script>

<style scoped>
.email-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Separate icon buttons, no shared frame; the chosen one is tinted */
.filter-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: background-color .15s, color .15s;
}

.filter-btn:hover {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.filter-btn:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}

.filter-btn.on {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.filter-search {
  flex: 1 1 220px;
  max-width: 360px;
}
</style>
