<template>
  <div class="content-box" ref="contentBox">
    <div ref="container" class="content-html"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUiStore } from '@/store/ui.js'

const props = defineProps({
  html: {
    type: String,
    required: true
  }
})

const uiStore = useUiStore()
const container = ref(null)
const contentBox = ref(null)
let shadowRoot = null

function updateContent() {
  if (!shadowRoot) return;

        // 1. Extract <body> style attribute (if present)
  const bodyStyleRegex = /<body[^>]*style="([^"]*)"[^>]*>/i;
  const bodyStyleMatch = props.html.match(bodyStyleRegex);
  const bodyStyle = bodyStyleMatch ? bodyStyleMatch[1] : '';

        // 2. Remove <body> tags (keep content)
  // <style> rules aimed at body only work if they target our wrapper instead
  const cleanedHtml = props.html
    .replace(/<\/?body[^>]*>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, css => css
      .replace(/(^|[}>,\s])body(?=\s*[{,])/gi, '$1.shadow-content')
      // the wrapper is always white, so a sender's dark-mode rules would leave pale text on it
      .replace(/prefers-color-scheme\s*:\s*dark/gi, 'prefers-color-scheme: none'));

        // 3. Apply body style to .shadow-content
  shadowRoot.innerHTML = `
    <style>
      :host {
        all: initial;
        width: 100%;
        height: 100%;
        font-family: -apple-system, Inter, BlinkMacSystemFont,
                    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #13181D;
        word-break: break-word;
      }

      h1, h2, h3, h4 {
          font-size: 18px;
          font-weight: 700;
      }

      p {
        margin: 0;
      }

      a {
        text-decoration: none;
        color: #0E70DF;
      }

      .shadow-content {
        background: #FFFFFF;
        width: 100%;
        max-width: 100%;
        height: fit-content;
        box-sizing: border-box;
        overflow-wrap: anywhere;
        ${bodyStyle} /* Inject body style */
      }

      table {
        max-width: 100%;
      }

      ${uiStore.dark ? `
      /* dark theme: invert the light email, then flip media back so it keeps its colours */
      .shadow-content {
        background: #E2E2E2;
        filter: invert(1) hue-rotate(180deg);
      }
      img, video, picture {
        filter: invert(1) hue-rotate(180deg);
      }` : ''}

      img:not(table img) {
        max-width: 100%;
        height: auto !important;
      }

    </style>
    <div class="shadow-content">
      ${cleanedHtml}
    </div>
  `;

  openLinksInNewTab();
}

// Links in an email open in a new tab instead of replacing the app
function openLinksInNewTab() {
  shadowRoot.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href').trim().toLowerCase();
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });
}

onMounted(() => {
  shadowRoot = container.value.attachShadow({ mode: 'open' })
  updateContent()
})

watch(() => [props.html, uiStore.dark], () => {
  updateContent()
})
</script>

<style scoped>
.content-box {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, Inter, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
}

.content-html {
  width: 100%;
  height: 100%;
}
</style>
