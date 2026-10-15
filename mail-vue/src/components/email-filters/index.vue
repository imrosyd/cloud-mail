<template>
  <div class="email-filters">
    <el-input v-model="text" class="filter-search" clearable :placeholder="$t('inboxSearch')"
              :aria-label="$t('inboxSearch')" @keyup.enter="apply" @clear="apply">
      <template #prefix>
        <Icon icon="iconoir:search" width="16" height="16"/>
      </template>
    </el-input>
    <el-radio-group v-model="view" size="small" @change="apply">
      <el-radio-button value="all">{{ $t('filterAll') }}</el-radio-button>
      <el-radio-button v-if="showUnread" value="unread">{{ $t('filterUnread') }}</el-radio-button>
      <el-radio-button value="starred">{{ $t('filterStarred') }}</el-radio-button>
    </el-radio-group>
  </div>
</template>

<script setup>
import {ref} from "vue";
import {Icon} from "@iconify/vue";

defineProps({
  showUnread: {type: Boolean, default: false}
})

const emit = defineEmits(['change'])
const text = ref('')
const view = ref('all')

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

.filter-search {
  flex: 1 1 220px;
  max-width: 360px;
}
</style>
