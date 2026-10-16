<template>
  <div class="hamburger-box" @click="toggleClick">
    <button type="button" class="hamburger" :title="label" :aria-label="label" :aria-expanded="isActive">
      <!-- The arrow points the way the sidebar will move: close it while open, open it while closed -->
      <Icon :icon="isActive ? 'lucide:panel-left-close' : 'lucide:panel-left-open'" width="22" height="22"/>
    </button>
  </div>
</template>

<script setup>
import {computed} from "vue";
import {Icon} from "@iconify/vue";
import {useI18n} from "vue-i18n";

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits()
const {t} = useI18n()
const label = computed(() => props.isActive ? t('hideSidebar') : t('showSidebar'))
const toggleClick = () => {
  emit('toggleClick');
}
</script>

<style scoped>
.hamburger-box {
  padding: 0 15px;
  display: flex;
  align-items: center;
}

.hamburger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background-color .15s;
}

.hamburger:hover,
.hamburger:focus-visible {
  background: var(--el-fill-color);
}
</style>
