<template>
  <div class="attr-library">
    <div class="lib-panel">
      <div class="lib-header">
        <div class="lib-title-row">
          <span class="lib-title">属性库</span>
          <span class="lib-desc">全局属性定义，角色和系统模板共享使用</span>
        </div>
        <button class="add-btn" @click="handleAdd">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          添加属性
        </button>
      </div>
      <div class="lib-body">
        <div v-if="libStore.attributes.length > 0" class="attr-grid">
          <div v-for="attr in libStore.attributes" :key="attr.id" class="attr-card" :class="{ editing: editingId === attr.id }">
            <!-- Card Header -->
            <div class="card-top">
              <div class="card-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
              </div>
              <div class="card-actions">
                <button v-if="editingId !== attr.id" class="action-btn" title="编辑" @click="startEdit(attr)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button v-else class="action-btn save" title="保存" @mousedown.prevent @click="saveEdit">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <button class="action-btn danger" title="删除" @click="handleRemove(attr.id, attr.name)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            <!-- Read-only view -->
            <template v-if="editingId !== attr.id">
              <div class="card-field">
                <span class="field-label">名称</span>
                <span class="field-value">{{ attr.name || '—' }}</span>
              </div>
              <div class="card-row">
                <div class="card-field">
                  <span class="field-label">英文名</span>
                  <span class="field-value mono">{{ attr.key || '—' }}</span>
                </div>
              </div>
              <div v-if="attr.description" class="card-field">
                <span class="field-label">描述</span>
                <span class="field-value desc">{{ attr.description }}</span>
              </div>
            </template>

            <!-- Edit view -->
            <template v-else>
              <div class="card-field">
                <span class="field-label">名称</span>
                <el-input v-model="editDraft.name" size="small" placeholder="属性名称" />
              </div>
              <div class="card-field">
                <span class="field-label">英文名</span>
                <el-input v-model="editDraft.key" size="small" placeholder="如 ATK, HP, DEF" />
              </div>
              <div class="card-field">
                <span class="field-label">描述</span>
                <el-input v-model="editDraft.description" size="small" placeholder="属性描述（可选）" />
              </div>
            </template>
          </div>
        </div>
        <div v-else class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
          <span class="empty-text">暂无属性，点击"添加属性"开始定义</span>
          <span class="empty-desc">属性库中的属性可被角色配置和系统模板引用</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useAttributeLibraryStore } from '../store/attributeLibrary'

const libStore = useAttributeLibraryStore()
const editingId = ref<string | null>(null)
const editDraft = reactive({ name: '', key: '', description: '' })

function startEdit(attr: { id: string; name: string; key: string; description: string }) {
  editingId.value = attr.id
  editDraft.name = attr.name
  editDraft.key = attr.key
  editDraft.description = attr.description
}

function saveEdit() {
  if (editingId.value) {
    libStore.updateAttribute(editingId.value, {
      name: editDraft.name,
      key: editDraft.key,
      description: editDraft.description
    })
  }
  editingId.value = null
}

function handleAdd() {
  const id = libStore.addAttribute('新属性')
  const attr = libStore.attributes.find(a => a.id === id)
  if (attr) startEdit(attr)
}

async function handleRemove(id: string, name: string) {
  try {
    await ElMessageBox.confirm(
      `删除属性「${name}」后，引用该属性的效果将失效。确定删除？`,
      '确认删除',
      { type: 'warning' }
    )
    if (editingId.value === id) editingId.value = null
    libStore.removeAttribute(id)
    ElMessage.success('已删除')
  } catch { /* cancelled */ }
}
</script>

<style scoped>
.attr-library {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: stretch;
  padding: 24px;
  overflow: hidden;
  background: var(--color-bg);
}

.lib-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.lib-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.lib-title-row { display: flex; flex-direction: column; gap: 2px; }
.lib-title { font-size: 16px; font-weight: 700; color: var(--color-text); }
.lib-desc { font-size: 12px; color: var(--color-text-muted); }

.lib-body { flex: 1; overflow-y: auto; padding: 16px 24px; }

.attr-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.attr-card {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  transition: all 0.15s;
}

.attr-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); }
.attr-card.editing { border-color: var(--color-primary); background: #fafbff; }

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
}

.card-actions { display: flex; gap: 4px; }

.action-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover { color: var(--color-primary); border-color: var(--color-primary); background: var(--color-primary-light); }
.action-btn.save { color: var(--color-success); border-color: var(--color-success); }
.action-btn.save:hover { background: #ecfdf5; }
.action-btn.danger:hover { color: var(--color-danger); border-color: var(--color-danger); background: #fef2f2; }

.card-field { display: flex; flex-direction: column; gap: 2px; }
.card-row { display: flex; gap: 12px; }
.card-row .card-field { flex: 1; min-width: 0; }

.field-label { font-size: 10px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.field-value { font-size: 13px; color: var(--color-text); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.field-value.mono { font-family: monospace; color: var(--color-primary); }
.field-value.desc { font-weight: 400; color: var(--color-text-secondary); font-size: 12px; }

.add-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px dashed var(--color-primary);
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.add-btn:hover { background: var(--color-primary); color: white; border-style: solid; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 24px;
  color: var(--color-text-muted);
}

.empty-text { font-size: 14px; }
.empty-desc { font-size: 12px; color: var(--color-text-muted); }
</style>
