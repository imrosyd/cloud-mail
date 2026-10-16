<template>
  <div class="page-bar" v-if="total > PAGE_SIZES[0]">
    <el-pagination background
                   :size="narrow ? 'small' : 'default'"
                   :current-page="page"
                   :page-size="size"
                   :page-sizes="PAGE_SIZES"
                   :pager-count="narrow ? 5 : 7"
                   :layout="narrow ? 'prev, pager, next' : 'total, sizes, prev, pager, next'"
                   :total="total"
                   @current-change="onPage"
                   @size-change="onSize"/>
    <el-pagination v-if="narrow" background size="small"
                   :current-page="page"
                   :page-size="size"
                   :page-sizes="PAGE_SIZES"
                   layout="total, sizes"
                   :total="total"
                   @size-change="onSize"/>
  </div>
</template>

<script setup>
import {ref} from "vue";
import {PAGE_SIZES, savePageSize} from "@/composables/usePageSize.js";

const props = defineProps({
  page: {type: Number, default: 1},
  size: {type: Number, default: 10},
  total: {type: Number, default: 0},
  // Remembers the chosen page size for this list
  storageKey: {type: String, default: ''}
})

const emit = defineEmits(['update:page', 'update:size', 'change'])
const narrow = ref(window.innerWidth < 600)

function onPage(page) {
  emit('update:page', page)
  emit('change')
}

function onSize(size) {
  if (props.storageKey) savePageSize(props.storageKey, size)
  emit('update:size', size)
  emit('update:page', 1)
  emit('change')
}
</script>

<style scoped>
.page-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 15px 20px;
}
</style>
