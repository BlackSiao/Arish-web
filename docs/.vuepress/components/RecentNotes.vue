<template>
  <div class="recent-notes">
    <h3>最新文档</h3>
    <ul>
      <li v-for="item in items" :key="item.link">
        <a :href="item.link">{{ item.title }}</a>
        <small class="date">{{ formatDate(item.date) }}</small>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const items = ref([])

function formatDate(s) {
  try {
    return new Date(s).toLocaleString()
  } catch (e) { return s }
}

onMounted(async () => {
  try {
    const res = await fetch('/recent.json')
    if (!res.ok) return
    const data = await res.json()
    items.value = data
  } catch (e) {
    // ignore fetch errors
  }
})
</script>

<style scoped>
.recent-notes { padding: 12px; border-radius: 6px; background: var(--vp-c-page-bg); }
.recent-notes ul { list-style: none; padding: 0; margin: 0; }
.recent-notes li { margin: 6px 0; display:flex; gap:8px; align-items:center }
.recent-notes .date { color: var(--vp-c-muted); font-size: 12px }
</style>
