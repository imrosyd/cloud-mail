<template>
  <div class="editor-box" :class="showLoading ? 'editor-box-loading' : ''">
    <loading class="loading" v-if="showLoading"/>
    <textarea v-else style="outline: none" :id="editorId" ref="editorRef"></textarea>
  </div>
</template>

<script setup>
import {ref, onMounted, onBeforeUnmount, watch, nextTick, shallowRef, defineEmits, computed} from 'vue';
import loading from "@/components/loading/index.vue";
import {useI18n} from 'vue-i18n'
import {useUiStore} from '@/store/ui.js'
import {useSettingStore} from '@/store/setting.js'
import toolbarIcons from './icons.js'

defineExpose({
  clearEditor,
  focus,
  getContent
})

const props = defineProps({
  defValue: {
    type: String,
    default: ''
  },
  editorId: {
    type: String,
    default: () => `editor-${Date.now()}`
  }
});


const {locale} = useI18n()
const emit = defineEmits(['change','focus']);
const editor = shallowRef(null);
const isInitialized = ref(false);
const editorRef = ref(null);
const showLoading = ref(false);
const uiStore = useUiStore();
const settingStore = useSettingStore();

onMounted(() => {
  initTinyMCE();
});

onBeforeUnmount(() => {
  destroyEditor();
});

watch(() => props.defValue, (newValue) => {
  if (editor.value && editor.value.getContent() !== newValue) {
    editor.value.setContent(newValue);
  }
});

watch(() => [uiStore.dark, settingStore.lang], () => {
  destroyEditor();
  initEditor();
});

const language = computed(() => {
  if (locale.value === 'zh') {
    return 'zh_CN'
  }

  return 'en'
})

function clearEditor() {
  if (editor.value) {
    editor.value.setContent('');
  }
}

function initTinyMCE() {
  if (window.tinymce) {
    initEditor();
  } else {
    showLoading.value = true;
    const script = document.createElement('script');
    script.src = '/tinymce/tinymce.min.js';
    script.onload = () => initEditor();
    document.head.appendChild(script);
    showLoading.value = false;
  }
}

function initEditor() {
  window.tinymce.init({
    selector: `#${props.editorId}`,
    statusbar: false,
    height: "100%",
    auto_focus: true,
    //relative_urls: false,  //Prevent tinymce from converting URLs to relative paths when domain matches
    //remove_script_host: false, // Prevent removing domain from URL
    forced_root_block: 'div',
    skin: `${uiStore.dark ? 'oxide-dark' : 'oxide'}`,
    content_css: `/tinymce/css/index.css,${uiStore.dark ? 'dark' : 'default'}`,
    content_style: `:root {
         --scrollbar-track-color: ${uiStore.dark ? '#141414' : '#FFFFFF'};
         --scrollbar-thumb-color: ${uiStore.dark ? '#8D9095' : '#A8ABB2'};
    }`,
    plugins: 'link image advlist lists  emoticons fullscreen  table preview code',
    // Two deliberate rows: text formatting on top, layout and inserts below
    toolbar: [
      'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor removeformat',
      'alignleft aligncenter alignright alignjustify | outdent indent | bullist numlist | blockquote hr | link image table | emoticons code preview fullscreen'
    ],
    // The root block is a div, so "Paragraph" must produce one too
    block_formats: 'Paragraph=div; Heading 1=h1; Heading 2=h2; Heading 3=h3; Preformatted=pre',
    // Faces that email clients have, each with a generic fallback
    font_family_formats: 'Sans Serif=Arial,Helvetica,sans-serif; Serif=Georgia,Times New Roman,serif; Monospace=Courier New,monospace; Verdana=Verdana,Geneva,sans-serif; Tahoma=Tahoma,Geneva,sans-serif; Trebuchet MS=Trebuchet MS,sans-serif',
    // Tools wrap onto a second row instead of hiding behind a "more" button
    toolbar_mode: 'wrap',
    font_size_formats: '8px 10px 12px 14px 16px 18px 24px 36px',
    emoticons_search: false,
    language: language.value,
    language_load: true,
    menubar: false,
    license_key: 'gpl',
    noneditable_class: 'mceNonEditable',
    setup: (ed) => {
      editor.value = ed;
      // One icon family with the rest of the app instead of TinyMCE's mixed set
      Object.entries(toolbarIcons).forEach(([name, svg]) => ed.ui.registry.addIcon(name, svg))
      ed.on('init', () => {
        ed.setContent(props.defValue);
        isInitialized.value = true;
      });
      ed.on('input change', () => {
        const content = ed.getContent();
        const text = ed.getContent({format: 'text'});
        emit('change', content, text);
      });
      ed.on('focus', () => {
        emit('focus', focus);
      })
    },
    autofocus: true,
    branding: false,
    file_picker_types: 'image',
    image_dimensions: false,
    image_description: false,
    link_title: false,
    dialog_type: 'none',
    file_picker_callback: (callback, value, meta) => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');

      input.addEventListener('change', async (e) => {
        let file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          const id = 'blobid' + (new Date()).getTime();
          const blobCache = tinymce.activeEditor.editorUpload.blobCache;
          const base64 = reader.result.split(',')[1];
          const blobInfo = blobCache.create(id, file, base64);
          blobCache.add(blobInfo);

          callback(blobInfo.blobUri(), {title: file.name});
        }
        reader.readAsDataURL(file);
      });

      input.click();
    }
  });
}

function focus() {
  nextTick(() => {
    editor.value.focus()
  })
}

function getContent() {
  return editor.value.getContent()
}


function destroyEditor() {
  if (editor.value) {
    editor.value.destroy();
    editor.value = null;
  }
}
</script>

<style lang="scss" scoped>
.editor-box {
  height: 100%;
  width: 100%;
}

.loading {
  margin: auto;
}

.editor-box-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.tox-tbtn.tox-tbtn--select.tox-tbtn--bespoke) {
  width: 112px !important;
}

:deep(.tox-tbtn.tox-tbtn--select.tox-tbtn--bespoke[data-mce-name='fontsize']) {
  width: 72px !important;
}

:deep(.tox.tox-tinymce.tox-fullscreen) {
  padding-right: 15px;
  padding-left: 15px;
  padding-bottom: 15px;
  background: var(--el-bg-color);
  @media (max-width: 767px) {
    padding-right: 10px;
    padding-left: 10px;
    padding-bottom: 10px;
  }
}

:deep(.tox-tinymce) {
  border: none;
  border-radius: 0;
}

:deep(.tox-toolbar__group) {
  padding: 0 6px 0 0 !important;
  margin: 0 6px 0 0 !important;
  border-right: 1px solid var(--el-border-color-lighter) !important;
}

:deep(.tox-toolbar__group:last-of-type) {
  border-right: none !important;
  margin-right: 0 !important;
}

:deep(.tox-tbtn) {
  margin: 0 !important;
}

:deep(.tox .tox-edit-area::before) {
  display: none;
}

</style>
