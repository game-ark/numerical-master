<template>
  <div class="app-layout">
    <!-- Top Navigation Bar -->
    <header class="app-header">
      <div class="header-brand">
        <div class="brand-icon">⚙️</div>
        <div class="brand-info">
          <span class="brand-title">数值配置模拟器</span>
          <span class="brand-subtitle">属性配置与分析工具</span>
        </div>
      </div>

      <nav class="header-nav">
        <button
          class="nav-btn"
          :class="{ active: currentView === 'config' }"
          @click="currentView = 'config'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
          <span>配置面板</span>
        </button>
        <button
          class="nav-btn"
          :class="{ active: currentView === 'systems' }"
          @click="currentView = 'systems'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>系统模板库</span>
        </button>
        <button
          class="nav-btn"
          :class="{ active: currentView === 'attributes' }"
          @click="currentView = 'attributes'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
          <span>属性库</span>
        </button>
      </nav>

      <div class="header-actions">
        <div class="role-badge">
          <span class="role-badge-dot"></span>
          <span class="role-badge-name">{{ store.config.name }}</span>
        </div>
        <div class="action-divider"></div>
        <button class="icon-btn" title="导出配置" @click="handleExport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="icon-btn" title="导入配置" @click="triggerImport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </button>
        <input ref="fileInputRef" type="file" accept=".json" style="display:none" @change="handleImport" />
      </div>
    </header>

    <!-- Main Content -->
    <div class="app-body">
      <template v-if="currentView === 'config'">
        <aside class="app-sidebar">
          <ConfigPanel @navigate="(v: string) => currentView = v as any" />
        </aside>
        <main class="app-main">
          <Dashboard />
        </main>
      </template>
      <template v-else-if="currentView === 'systems'">
        <SystemEditor />
      </template>
      <template v-else>
        <AttributeLibrary />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoleConfigStore } from '../store/roleConfig'
import { downloadJSON, readFileAsText } from '../utils/persistence'
import ConfigPanel from './ConfigPanel.vue'
import Dashboard from './Dashboard.vue'
import SystemEditor from './SystemEditor.vue'
import AttributeLibrary from './AttributeLibrary.vue'

const store = useRoleConfigStore()
const currentView = ref<'config' | 'systems' | 'attributes'>('config')
const fileInputRef = ref<HTMLInputElement | null>(null)

function handleExport() {
  const json = store.exportConfig()
  downloadJSON(json, `${store.config.name || 'role-config'}.json`)
  ElMessage.success('配置已导出')
}

function triggerImport() {
  fileInputRef.value?.click()
}

async function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const json = await readFileAsText(file)
    const result = store.importConfig(json)
    if (result.success) ElMessage.success('导入成功')
    else ElMessage.error(result.error || '导入失败')
  } catch {
    ElMessage.error('文件读取失败')
  }
  input.value = ''
}
</script>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg);
}

/* ===== Header ===== */
.app-header {
  height: 56px;
  min-height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  gap: 24px;
  z-index: 100;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.brand-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: var(--color-primary-light);
  border-radius: var(--radius-md);
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.brand-subtitle {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.2;
}

/* Navigation */
.header-nav {
  display: flex;
  gap: 4px;
  flex: 1;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.nav-btn:hover {
  background: var(--color-border-light);
  color: var(--color-text);
}

.nav-btn.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.role-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--color-border-light);
  border-radius: 20px;
}

.role-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
}

.role-badge-name {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.action-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 4px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: var(--color-border-light);
  color: var(--color-text);
  border-color: var(--color-text-muted);
}

/* ===== Body ===== */
.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.app-sidebar {
  width: 360px;
  min-width: 360px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
