<template>
  <div class="config-panel">
    <!-- Panel Tabs -->
    <div class="panel-tabs">
      <button class="panel-tab" :class="{ active: activeTab === 'role' }" @click="activeTab = 'role'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        角色属性
      </button>
      <button class="panel-tab" :class="{ active: activeTab === 'system' }" @click="activeTab = 'system'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        系统装备
      </button>
      <button class="panel-tab" :class="{ active: activeTab === 'template' }" @click="activeTab = 'template'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        模板
      </button>
    </div>

    <!-- Role Config Tab -->
    <div v-show="activeTab === 'role'" class="tab-content">
      <!-- Role Basic Info -->
      <div class="config-section">
        <div class="section-title">基本信息</div>
        <div class="form-grid">
          <div class="form-item">
            <label class="form-label">角色名称</label>
            <el-input
              :model-value="store.config.name"
              placeholder="输入角色名称"
              size="default"
              @update:model-value="(v: string) => store.setRoleName(v)"
            />
          </div>
          <div class="form-item">
            <label class="form-label">全局成长系数</label>
            <el-input-number
              :model-value="store.config.growthFactor"
              :min="0.01"
              :step="0.1"
              :precision="2"
              size="default"
              style="width: 100%"
              @update:model-value="(v: number | undefined) => store.setGrowthFactor(v ?? 0.01)"
            />
          </div>
        </div>
      </div>

      <!-- Attributes Section -->
      <div class="config-section">
        <div class="section-header">
          <div class="section-title">属性列表</div>
        </div>

        <div v-if="store.config.attributes.length > 0" class="attr-table">
          <div class="attr-table-head">
            <span class="attr-col-name">名称</span>
            <span class="attr-col-num">初始值</span>
            <span class="attr-col-num">基础成长</span>
            <span class="attr-col-act"></span>
          </div>
          <TransitionGroup name="attr-list" tag="div" class="attr-table-body">
            <div v-for="(attr, idx) in store.config.attributes" :key="attr.id" class="attr-row">
              <span class="attr-col-name attr-name-label">{{ libStore.getAttributeName(attr.id) }}</span>
              <el-input-number
                :model-value="attr.initialValue"
                :min="0"
                size="small"
                controls-position="right"
                class="attr-col-num"
                @update:model-value="(v: number | undefined) => store.updateAttribute(idx, { initialValue: v ?? 0 })"
              />
              <el-input-number
                :model-value="attr.baseGrowth"
                :min="0"
                size="small"
                controls-position="right"
                class="attr-col-num"
                @update:model-value="(v: number | undefined) => store.updateAttribute(idx, { baseGrowth: v ?? 0 })"
              />
              <button class="delete-btn" @click="store.removeAttribute(idx)" title="删除属性">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </TransitionGroup>
        </div>

        <!-- Add from library -->
        <el-select
          v-if="unusedLibraryAttrs.length > 0"
          :key="'add-attr-' + store.config.attributes.length"
          model-value=""
          placeholder="+ 从属性库添加"
          size="small"
          style="width: 100%; margin-top: 6px"
          @change="(v: string) => handleAddFromLibrary(v)"
        >
          <el-option
            v-for="la in unusedLibraryAttrs"
            :key="la.id"
            :label="la.name"
            :value="la.id"
          />
        </el-select>
        <div v-else-if="store.config.attributes.length === 0 && libStore.attributes.length === 0" class="empty-state">
          <span class="empty-icon">📋</span>
          <span class="empty-text">请先在属性库中定义属性</span>
        </div>
      </div>
    </div>

    <!-- System Binding Tab -->
    <div v-show="activeTab === 'system'" class="tab-content">
      <div class="config-section">
        <div class="section-header">
          <div class="section-title">已装备系统</div>
          <el-dropdown trigger="click" size="default">
            <button class="add-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              引用系统
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="st in availableSystems"
                  :key="st.id"
                  @click="store.addSystemBinding(st.id)"
                >
                  <span class="sys-dot" :style="{ background: st.color }"></span>
                  {{ st.name }}
                </el-dropdown-item>
                <el-dropdown-item v-if="availableSystems.length === 0" disabled>
                  无可用系统模板
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div v-if="store.config.systemBindings.length > 0" class="bindings-list">
          <div
            v-for="(binding, bIdx) in store.config.systemBindings"
            :key="binding.systemTemplateId"
            class="binding-card"
          >
            <div class="binding-header">
              <span class="binding-color" :style="{ background: getSystemColor(binding.systemTemplateId) }"></span>
              <span class="binding-name">{{ getSystemName(binding.systemTemplateId) }}</span>
              <span class="binding-count">{{ binding.activeResourceIds.length }} / {{ getSystemResources(binding.systemTemplateId).length }} 资源</span>
              <button class="delete-btn" @click="store.removeSystemBinding(bIdx)" title="移除装备">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="binding-resources">
              <!-- Already selected: tag list -->
              <div v-if="binding.activeResourceIds.length > 0" class="res-tag-list">
                <span
                  v-for="rid in binding.activeResourceIds"
                  :key="rid"
                  class="res-tag"
                >
                  {{ getResourceName(binding.systemTemplateId, rid) }}
                  <button class="res-tag-close" @click="store.toggleResource(bIdx, rid)" title="移除">×</button>
                </span>
              </div>
              <!-- Add new: dropdown with only unselected resources -->
              <el-select
                v-if="getUnselectedResources(binding).length > 0"
                :key="'res-add-' + bIdx + '-' + binding.activeResourceIds.length"
                model-value=""
                placeholder="+ 添加资源"
                size="small"
                style="width: 180px"
                @change="(v: string) => store.toggleResource(bIdx, v)"
              >
                <el-option
                  v-for="res in getUnselectedResources(binding)"
                  :key="res.id"
                  :label="`${res.name}（${res.effects.length} 效果）`"
                  :value="res.id"
                />
              </el-select>
              <span v-if="getSystemResources(binding.systemTemplateId).length === 0" class="empty-hint">该系统暂无资源</span>
            </div>
            <!-- Active Combo Effects -->
            <div v-if="getActiveCombos(binding).length > 0" class="binding-combos">
              <div
                v-for="combo in getActiveCombos(binding)"
                :key="combo.id"
                class="combo-badge"
              >
                <span class="combo-badge-icon">🔗</span>
                <span class="combo-badge-name">{{ combo.name }}</span>
                <span class="combo-badge-count">+{{ combo.effects.length }} 效果</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <span class="empty-icon">🔗</span>
          <span class="empty-text">点击"引用系统"装备成长系统</span>
        </div>
      </div>

      <div class="goto-editor" @click="goToSystemEditor">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span>管理系统模板库</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>

    <!-- Template Tab -->
    <div v-show="activeTab === 'template'" class="tab-content">
      <div class="config-section">
        <div class="section-header">
          <div class="section-title">配置模板</div>
          <button class="add-btn" @click="handleSaveTemplate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            {{ store.activeTemplateId ? '覆盖保存' : '保存当前' }}
          </button>
        </div>

        <!-- Reset button -->
        <button class="template-card template-reset" @click="handleResetConfig">
          <div class="template-icon">🔄</div>
          <div class="template-info">
            <span class="template-name">恢复默认配置</span>
            <span class="template-desc">重置为示例角色数据</span>
          </div>
        </button>

        <div v-if="templateStore.templates.length > 0" class="template-list">
          <div
            v-for="tpl in templateStore.templates"
            :key="tpl.id"
            class="template-card"
            :class="{ 'template-active': store.activeTemplateId === tpl.id }"
          >
            <div class="template-icon">{{ store.activeTemplateId === tpl.id ? '📝' : '📄' }}</div>
            <div class="template-info" @click="handleApplyTemplate(tpl.id)">
              <span class="template-name">
                {{ tpl.name }}
                <span v-if="store.activeTemplateId === tpl.id" class="active-badge">当前</span>
              </span>
              <span class="template-desc">{{ tpl.attributes.length }} 属性 · 系数 {{ tpl.growthFactor }}</span>
            </div>
            <div class="template-actions">
              <button class="mini-btn" title="重命名" @click.stop="handleRenameTemplate(tpl.id, tpl.name)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="mini-btn danger" title="删除" @click.stop="handleDeleteTemplate(tpl.id, tpl.name)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state" style="margin-top: 8px;">
          <span class="empty-icon">💾</span>
          <span class="empty-text">暂无保存的模板</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoleConfigStore } from '../store/roleConfig'
import { useTemplateStore } from '../store/template'
import { useSystemTemplateStore } from '../store/systemTemplate'
import { useAttributeLibraryStore } from '../store/attributeLibrary'
import { defaultConfig } from '../data/defaultConfig'
import type { Resource, RoleSystemBinding, ComboEffect } from '../types/index'

const emit = defineEmits<{ (e: 'navigate', view: string): void }>()

const store = useRoleConfigStore()
const templateStore = useTemplateStore()
const sysStore = useSystemTemplateStore()
const libStore = useAttributeLibraryStore()
const activeTab = ref<'role' | 'system' | 'template'>('role')

const availableSystems = computed(() => {
  const boundIds = new Set(store.config.systemBindings.map(b => b.systemTemplateId))
  return sysStore.templates.filter(t => !boundIds.has(t.id))
})

const unusedLibraryAttrs = computed(() => {
  const usedIds = new Set(store.config.attributes.map(a => a.id))
  return libStore.attributes.filter(a => !usedIds.has(a.id))
})

function handleAddFromLibrary(attrId: string) {
  const libAttr = libStore.attributes.find(a => a.id === attrId)
  if (!libAttr) return
  store.config.attributes.push({ id: libAttr.id, name: libAttr.name, initialValue: 0, baseGrowth: 0 })
}

function getSystemName(id: string) { return sysStore.getTemplate(id)?.name ?? '(已删除)' }
function getSystemColor(id: string) { return sysStore.getTemplate(id)?.color ?? '#ccc' }
function getSystemResources(id: string): Resource[] { return sysStore.getTemplate(id)?.resources ?? [] }

function getResourceName(systemId: string, resourceId: string): string {
  const res = getSystemResources(systemId).find(r => r.id === resourceId)
  return res?.name ?? '(已删除)'
}

function getUnselectedResources(binding: RoleSystemBinding): Resource[] {
  const activeSet = new Set(binding.activeResourceIds)
  return getSystemResources(binding.systemTemplateId).filter(r => !activeSet.has(r.id))
}

function getActiveCombos(binding: RoleSystemBinding): ComboEffect[] {
  const tpl = sysStore.getTemplate(binding.systemTemplateId)
  if (!tpl || !tpl.comboEffects) return []
  const activeSet = new Set(binding.activeResourceIds)
  return tpl.comboEffects.filter(
    c => c.requiredResourceIds.length >= 2 &&
         c.effects.length > 0 &&
         c.requiredResourceIds.every(rid => activeSet.has(rid))
  )
}

function handleResetConfig() {
  store.loadConfig(JSON.parse(JSON.stringify(defaultConfig)))
  // loadConfig already sets activeTemplateId to null
}
function goToSystemEditor() { emit('navigate', 'systems') }

async function handleSaveTemplate() {
  const name = store.config.name?.trim()
  if (!name) {
    ElMessage.warning('请先设置角色名称')
    return
  }

  // If currently editing a template, directly overwrite it
  if (store.activeTemplateId) {
    const existing = templateStore.templates.find(t => t.id === store.activeTemplateId)
    if (existing) {
      templateStore.removeTemplate(existing.id)
    }
    const result = templateStore.saveTemplate(name, store.config.name, store.config.growthFactor, store.config.attributes)
    if (result.success) {
      // Track the new template ID
      const newTpl = templateStore.templates.find(t => t.name === name)
      if (newTpl) store.activeTemplateId = newTpl.id
      ElMessage.success('模板已覆盖保存')
    }
    return
  }

  // New save: use role name, handle duplicate
  if (templateStore.isNameDuplicate(name)) {
    try {
      await ElMessageBox.confirm(`模板"${name}"已存在，是否覆盖？`, '名称重复', { type: 'warning' })
      const existing = templateStore.templates.find(t => t.name === name)
      if (existing) templateStore.removeTemplate(existing.id)
    } catch { return /* cancelled */ }
  }
  const result = templateStore.saveTemplate(name, store.config.name, store.config.growthFactor, store.config.attributes)
  if (result.success) {
    const newTpl = templateStore.templates.find(t => t.name === name)
    if (newTpl) store.activeTemplateId = newTpl.id
    ElMessage.success('模板已保存')
  }
}

function handleApplyTemplate(id: string) {
  const data = templateStore.applyTemplate(id)
  if (data) {
    store.config.name = data.roleName
    store.config.growthFactor = data.growthFactor
    store.config.attributes = data.attributes
    store.activeTemplateId = id
    store.forceRecalculate()
    ElMessage.success('模板已应用')
  }
}

async function handleRenameTemplate(id: string, oldName: string) {
  try {
    const { value: newName } = await ElMessageBox.prompt('请输入新名称', '重命名模板', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputValue: oldName,
    })
    if (!newName?.trim()) { ElMessage.warning('名称不能为空'); return }
    const result = templateStore.renameTemplate(id, newName)
    if (result.success) ElMessage.success('已重命名')
    else ElMessage.error(result.error || '重命名失败')
  } catch { /* cancelled */ }
}

async function handleDeleteTemplate(id: string, name: string) {
  try {
    await ElMessageBox.confirm(`确定删除模板"${name}"？`, '确认删除', { type: 'warning' })
    templateStore.removeTemplate(id)
    ElMessage.success('已删除')
  } catch { /* cancelled */ }
}
</script>

<style scoped>
.config-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== Panel Tabs ===== */
.panel-tabs {
  display: flex;
  padding: 12px 16px 0;
  gap: 4px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.panel-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  position: relative;
}

.panel-tab:hover {
  color: var(--color-text);
  background: var(--color-border-light);
}

.panel-tab.active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.panel-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px 2px 0 0;
}

/* ===== Tab Content ===== */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== Config Section ===== */
.config-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ===== Form ===== */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* ===== Attribute Table ===== */
.attr-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.attr-table-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--color-border-light);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.attr-table-body {
  display: flex;
  flex-direction: column;
}

.attr-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-top: 1px solid var(--color-border-light);
  transition: background 0.1s;
}

.attr-row:hover {
  background: #fafbff;
}

.attr-col-name { flex: 2; min-width: 0; }
.attr-name-label { font-size: 13px; font-weight: 500; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.attr-col-num { flex: 2; min-width: 0; }
.attr-col-act { width: 28px; flex-shrink: 0; }

/* Transition */
.attr-list-enter-active,
.attr-list-leave-active {
  transition: all 0.2s ease;
}
.attr-list-enter-from { opacity: 0; transform: translateY(-8px); }
.attr-list-leave-to { opacity: 0; transform: translateX(16px); }

/* ===== Buttons ===== */
.add-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px dashed var(--color-primary);
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.add-btn:hover {
  background: var(--color-primary);
  color: white;
  border-style: solid;
}

.delete-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: #fef2f2;
  color: var(--color-danger);
}

/* ===== System Bindings ===== */
.bindings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.binding-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.binding-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color-border-light);
}

.binding-color {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.binding-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
}

.binding-count {
  font-size: 11px;
  color: var(--color-text-muted);
}

.binding-resources {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.res-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.res-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 10px;
  background: var(--color-primary-light);
  border: 1px solid rgba(79, 70, 229, 0.2);
  border-radius: 14px;
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 500;
}

.res-tag-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: rgba(79, 70, 229, 0.15);
  border-radius: 50%;
  font-size: 12px;
  line-height: 1;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
  font-family: inherit;
}

.res-tag-close:hover {
  background: var(--color-danger);
  color: white;
}

.empty-hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

.sys-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
}

/* ===== Combo Badges ===== */
.binding-combos {
  padding: 6px 12px 8px;
  border-top: 1px dashed var(--color-border-light);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.combo-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid #fbbf24;
  border-radius: 12px;
  font-size: 11px;
}

.combo-badge-icon { font-size: 10px; }
.combo-badge-name { color: #92400e; font-weight: 600; }
.combo-badge-count { color: #b45309; font-weight: 500; }

/* ===== Go to Editor ===== */
.goto-editor {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.goto-editor:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.goto-editor svg:last-child {
  margin-left: auto;
}

/* ===== Templates ===== */
.template-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}

.template-card:hover {
  border-color: var(--color-primary);
  background: #fafbff;
}

.template-active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.active-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  color: white;
  background: var(--color-primary);
  padding: 1px 6px;
  border-radius: 8px;
  margin-left: 6px;
  vertical-align: middle;
}

.template-reset {
  border-style: dashed;
  background: var(--color-border-light);
}

.template-reset:hover {
  background: #fff7ed;
  border-color: var(--color-warning);
}

.template-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.template-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.template-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-desc {
  font-size: 11px;
  color: var(--color-text-muted);
}

.template-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.mini-btn {
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

.mini-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.mini-btn.danger:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
  background: #fef2f2;
}

/* ===== Empty State ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 24px;
  opacity: 0.6;
}

.empty-text {
  font-size: 12px;
}
</style>
