<template>
  <div class="system-editor">
    <!-- Left: System List -->
    <div class="sys-list-panel">
      <div class="sys-list-header">
        <span class="panel-title">系统模板</span>
        <button class="add-btn-sm" @click="handleAddSystem">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建
        </button>
      </div>
      <div class="sys-list-body">
        <div
          v-for="st in sysStore.templates"
          :key="st.id"
          class="sys-list-item"
          :class="{ active: selectedId === st.id }"
          @click="selectedId = st.id"
        >
          <span class="sys-color-indicator" :style="{ background: st.color }"></span>
          <div class="sys-item-info">
            <span class="sys-item-name">{{ st.name }}</span>
            <span class="sys-item-meta">{{ st.resources.length }} 资源 · {{ countEffects(st) }} 效果 · {{ (st.comboEffects || []).length }} 组合</span>
          </div>
        </div>
        <div v-if="sysStore.templates.length === 0" class="empty-state">
          <span class="empty-icon">⚙️</span>
          <span class="empty-text">点击"新建"创建系统模板</span>
        </div>
      </div>
    </div>

    <!-- Right: Detail Panel -->
    <div class="sys-detail-panel">
      <template v-if="selectedSystem">
        <!-- System Header -->
        <div class="detail-header">
          <el-color-picker
            :model-value="selectedSystem.color"
            size="default"
            @update:model-value="(v: string | null) => sysStore.updateTemplate(selectedSystem!.id, { color: v ?? '#409EFF' })"
          />
          <el-input
            :model-value="selectedSystem.name"
            size="large"
            placeholder="系统名称"
            class="sys-name-input"
            @update:model-value="(v: string) => sysStore.updateTemplate(selectedSystem!.id, { name: v })"
          />
          <div style="flex:1"></div>
          <button class="danger-btn" @click="handleDeleteSystem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            删除系统
          </button>
        </div>

        <!-- Detail Tabs: Resources / Combos -->
        <div class="detail-tabs">
          <button class="detail-tab" :class="{ active: detailTab === 'resources' }" @click="detailTab = 'resources'">
            📦 资源列表
            <span class="tab-badge">{{ selectedSystem.resources.length }}</span>
          </button>
          <button class="detail-tab" :class="{ active: detailTab === 'combos' }" @click="detailTab = 'combos'">
            🔗 组合效果
            <span class="tab-badge">{{ (selectedSystem.comboEffects || []).length }}</span>
          </button>
        </div>

        <!-- Resources Tab -->
        <div v-show="detailTab === 'resources'" class="detail-body">
          <div class="res-toolbar">
            <span class="res-title">资源列表</span>
            <button class="add-btn-sm" @click="sysStore.addResource(selectedSystem!.id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              添加资源
            </button>
          </div>
          <div class="res-scroll">
            <div v-for="(res, rIdx) in selectedSystem.resources" :key="res.id" class="res-card">
              <div class="res-card-header">
                <el-input :model-value="res.name" size="default" placeholder="资源名称" style="width:200px"
                  @update:model-value="(v: string) => sysStore.updateResource(selectedSystem!.id, rIdx, { name: v })" />
                <div style="flex:1"></div>
                <button class="add-btn-sm" @click="sysStore.addEffect(selectedSystem!.id, rIdx)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  效果
                </button>
                <button class="delete-btn-sm" @click="sysStore.removeResource(selectedSystem!.id, rIdx)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div v-if="res.effects.length > 0" class="eff-table">
                <div class="eff-table-head">
                  <span class="eff-col-attr">目标属性</span>
                  <span class="eff-col-type">类型</span>
                  <span class="eff-col-val">数值</span>
                  <span class="eff-col-lvl">级别</span>
                  <span class="eff-col-act"></span>
                </div>
                <div v-for="(eff, eIdx) in res.effects" :key="eff.id" class="eff-table-row">
                  <el-select :model-value="eff.targetAttributeId" placeholder="选择属性" size="small" class="eff-col-attr"
                    @update:model-value="(v: string) => sysStore.updateEffect(selectedSystem!.id, rIdx, eIdx, { targetAttributeId: v })">
                    <el-option v-for="attr in libStore.attributes" :key="attr.id" :label="attr.name" :value="attr.id" />
                  </el-select>
                  <el-select :model-value="eff.type" size="small" class="eff-col-type"
                    @update:model-value="(v: string) => sysStore.updateEffect(selectedSystem!.id, rIdx, eIdx, { type: v as 'fixed' | 'percent' })">
                    <el-option label="固定值" value="fixed" />
                    <el-option label="百分比" value="percent" />
                  </el-select>
                  <el-input-number :model-value="eff.value" size="small" controls-position="right" class="eff-col-val"
                    @update:model-value="(v: number | undefined) => sysStore.updateEffect(selectedSystem!.id, rIdx, eIdx, { value: v ?? 0 })" />
                  <el-input-number :model-value="eff.level" :min="0" size="small" controls-position="right" class="eff-col-lvl"
                    @update:model-value="(v: number | undefined) => sysStore.updateEffect(selectedSystem!.id, rIdx, eIdx, { level: v ?? 0 })" />
                  <button class="delete-btn-sm" @click="sysStore.removeEffect(selectedSystem!.id, rIdx, eIdx)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
              <div v-else class="eff-empty">暂无效果</div>
            </div>
            <div v-if="selectedSystem.resources.length === 0" class="empty-state-lg">
              <span class="empty-icon">📦</span>
              <span class="empty-text">暂无资源，点击"添加资源"开始配置</span>
            </div>
          </div>
        </div>

        <!-- Combo Effects Tab -->
        <div v-show="detailTab === 'combos'" class="detail-body">
          <div class="res-toolbar">
            <div>
              <span class="res-title">组合效果</span>
              <span class="res-subtitle">当指定的多个资源同时激活时，额外触发的效果</span>
            </div>
            <button class="add-btn-sm" @click="sysStore.addComboEffect(selectedSystem!.id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              添加组合
            </button>
          </div>
          <div class="res-scroll">
            <div
              v-for="(combo, cIdx) in (selectedSystem.comboEffects || [])"
              :key="combo.id"
              class="combo-card"
            >
              <!-- Combo Header -->
              <div class="combo-header">
                <div class="combo-icon">🔗</div>
                <el-input
                  :model-value="combo.name"
                  size="default"
                  placeholder="组合名称"
                  style="width: 200px"
                  @update:model-value="(v: string) => sysStore.updateComboEffect(selectedSystem!.id, cIdx, { name: v })"
                />
                <div style="flex:1"></div>
                <button class="add-btn-sm" @click="sysStore.addComboEffectItem(selectedSystem!.id, cIdx)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  效果
                </button>
                <button class="delete-btn-sm" @click="sysStore.removeComboEffect(selectedSystem!.id, cIdx)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <!-- Required Resources -->
              <div class="combo-section">
                <div class="combo-section-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  需要同时激活的资源
                  <span class="combo-req-count">{{ combo.requiredResourceIds.length }} / {{ selectedSystem.resources.length }}</span>
                </div>
                <div class="combo-resources">
                  <!-- Already selected: tag list -->
                  <div v-if="combo.requiredResourceIds.length > 0" class="res-tag-list">
                    <span
                      v-for="rid in combo.requiredResourceIds"
                      :key="rid"
                      class="res-tag"
                    >
                      {{ getResourceNameById(rid) }}
                      <button class="res-tag-close" @click="sysStore.toggleComboResource(selectedSystem!.id, cIdx, rid)" title="移除">×</button>
                    </span>
                  </div>
                  <!-- Add new: dropdown with only unselected resources -->
                  <el-select
                    v-if="getUnselectedComboResources(combo).length > 0"
                    :key="'combo-add-' + cIdx + '-' + combo.requiredResourceIds.length"
                    model-value=""
                    placeholder="+ 添加资源"
                    size="small"
                    style="width: 180px"
                    @change="(v: string) => sysStore.toggleComboResource(selectedSystem!.id, cIdx, v)"
                  >
                    <el-option
                      v-for="res in getUnselectedComboResources(combo)"
                      :key="res.id"
                      :label="res.name"
                      :value="res.id"
                    />
                  </el-select>
                  <span v-if="selectedSystem.resources.length === 0" class="combo-hint">请先添加资源</span>
                  <span v-else-if="combo.requiredResourceIds.length < 2" class="combo-hint warn">至少选择 2 个资源</span>
                </div>
              </div>

              <!-- Combo Effects -->
              <div class="combo-section">
                <div class="combo-section-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  触发效果
                </div>
                <div v-if="combo.effects.length > 0" class="eff-table">
                  <div class="eff-table-head">
                    <span class="eff-col-attr">目标属性</span>
                    <span class="eff-col-type">类型</span>
                    <span class="eff-col-val">数值</span>
                    <span class="eff-col-lvl">级别</span>
                    <span class="eff-col-act"></span>
                  </div>
                  <div v-for="(eff, eIdx) in combo.effects" :key="eff.id" class="eff-table-row">
                    <el-select :model-value="eff.targetAttributeId" placeholder="选择属性" size="small" class="eff-col-attr"
                      @update:model-value="(v: string) => sysStore.updateComboEffectItem(selectedSystem!.id, cIdx, eIdx, { targetAttributeId: v })">
                      <el-option v-for="attr in libStore.attributes" :key="attr.id" :label="attr.name" :value="attr.id" />
                    </el-select>
                    <el-select :model-value="eff.type" size="small" class="eff-col-type"
                      @update:model-value="(v: string) => sysStore.updateComboEffectItem(selectedSystem!.id, cIdx, eIdx, { type: v as 'fixed' | 'percent' })">
                      <el-option label="固定值" value="fixed" />
                      <el-option label="百分比" value="percent" />
                    </el-select>
                    <el-input-number :model-value="eff.value" size="small" controls-position="right" class="eff-col-val"
                      @update:model-value="(v: number | undefined) => sysStore.updateComboEffectItem(selectedSystem!.id, cIdx, eIdx, { value: v ?? 0 })" />
                    <el-input-number :model-value="eff.level" :min="0" size="small" controls-position="right" class="eff-col-lvl"
                      @update:model-value="(v: number | undefined) => sysStore.updateComboEffectItem(selectedSystem!.id, cIdx, eIdx, { level: v ?? 0 })" />
                    <button class="delete-btn-sm" @click="sysStore.removeComboEffectItem(selectedSystem!.id, cIdx, eIdx)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
                <div v-else class="eff-empty">暂无效果，点击上方"+ 效果"添加</div>
              </div>
            </div>

            <div v-if="(selectedSystem.comboEffects || []).length === 0" class="empty-state-lg">
              <span class="empty-icon">🔗</span>
              <span class="empty-text">暂无组合效果</span>
              <span class="empty-desc">组合效果在多个资源同时激活时触发额外加成</span>
            </div>
          </div>
        </div>

      </template>

      <template v-else>
        <div class="detail-empty">
          <div class="empty-icon-lg">⚙️</div>
          <div class="empty-title">选择系统模板</div>
          <div class="empty-desc">从左侧列表选择一个系统模板查看和编辑详情</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useSystemTemplateStore } from '../store/systemTemplate'
import { useRoleConfigStore } from '../store/roleConfig'
import { useAttributeLibraryStore } from '../store/attributeLibrary'
import type { SystemTemplate } from '../types/index'

const sysStore = useSystemTemplateStore()
const roleStore = useRoleConfigStore()
const libStore = useAttributeLibraryStore()
const selectedId = ref<string>('')
const detailTab = ref<'resources' | 'combos'>('resources')

const selectedSystem = computed(() => {
  if (!selectedId.value) return null
  return sysStore.getTemplate(selectedId.value) ?? null
})

function countEffects(st: SystemTemplate): number {
  const resEffects = st.resources.reduce((sum, r) => sum + r.effects.length, 0)
  const comboEffects = (st.comboEffects || []).reduce((sum, c) => sum + c.effects.length, 0)
  return resEffects + comboEffects
}

function getResourceNameById(resourceId: string): string {
  if (!selectedSystem.value) return '(未知)'
  const res = selectedSystem.value.resources.find(r => r.id === resourceId)
  return res?.name ?? '(已删除)'
}

function getUnselectedComboResources(combo: { requiredResourceIds: string[] }) {
  if (!selectedSystem.value) return []
  const selectedSet = new Set(combo.requiredResourceIds)
  return selectedSystem.value.resources.filter(r => !selectedSet.has(r.id))
}

function handleAddSystem() {
  const id = sysStore.addTemplate()
  selectedId.value = id
  detailTab.value = 'resources'
}

async function handleDeleteSystem() {
  if (!selectedSystem.value) return
  try {
    await ElMessageBox.confirm(
      `确定删除系统「${selectedSystem.value.name}」？此操作不可撤销。`,
      '确认删除',
      { type: 'warning' }
    )
    const id = selectedSystem.value.id
    selectedId.value = ''
    sysStore.removeTemplate(id)
  } catch { /* cancelled */ }
}
</script>

<style scoped>
.system-editor { height:100%; width:100%; flex:1; display:flex; overflow:hidden; background:var(--color-bg); }

/* Left Panel */
.sys-list-panel { width:260px; min-width:260px; background:var(--color-surface); border-right:1px solid var(--color-border); display:flex; flex-direction:column; overflow:hidden; }
.sys-list-header { display:flex; align-items:center; justify-content:space-between; padding:16px; border-bottom:1px solid var(--color-border-light); flex-shrink:0; }
.panel-title { font-size:14px; font-weight:700; color:var(--color-text); }
.sys-list-body { flex:1; overflow-y:auto; padding:8px; }
.sys-list-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:var(--radius-md); cursor:pointer; transition:all 0.15s ease; margin-bottom:2px; }
.sys-list-item:hover { background:var(--color-border-light); }
.sys-list-item.active { background:var(--color-primary-light); }
.sys-color-indicator { width:4px; height:32px; border-radius:2px; flex-shrink:0; }
.sys-item-info { flex:1; display:flex; flex-direction:column; gap:2px; min-width:0; }
.sys-item-name { font-size:13px; font-weight:600; color:var(--color-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sys-item-meta { font-size:11px; color:var(--color-text-muted); }

/* Right Panel */
.sys-detail-panel { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.detail-header { display:flex; align-items:center; gap:12px; padding:16px 24px; background:var(--color-surface); border-bottom:1px solid var(--color-border); flex-shrink:0; }
.sys-name-input { width:240px; }

/* Detail Tabs */
.detail-tabs { display:flex; gap:4px; padding:8px 24px; background:var(--color-surface); border-bottom:1px solid var(--color-border); flex-shrink:0; }
.detail-tab { display:flex; align-items:center; gap:6px; padding:7px 16px; border:none; background:transparent; border-radius:var(--radius-sm); font-size:13px; font-weight:500; color:var(--color-text-secondary); cursor:pointer; transition:all 0.15s; font-family:inherit; }
.detail-tab:hover { background:var(--color-border-light); color:var(--color-text); }
.detail-tab.active { background:var(--color-primary-light); color:var(--color-primary); font-weight:600; }
.tab-badge { font-size:11px; padding:1px 6px; background:var(--color-border); border-radius:10px; color:var(--color-text-muted); font-weight:600; }
.detail-tab.active .tab-badge { background:rgba(79,70,229,0.15); color:var(--color-primary); }

.detail-body { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.res-toolbar { display:flex; align-items:center; justify-content:space-between; padding:14px 24px; flex-shrink:0; }
.res-title { font-size:13px; font-weight:700; color:var(--color-text); }
.res-subtitle { display:block; font-size:11px; color:var(--color-text-muted); margin-top:2px; font-weight:400; }
.res-scroll { flex:1; overflow-y:auto; padding:0 24px 24px; display:flex; flex-wrap:wrap; gap:12px; align-content:flex-start; }

/* Resource Card */
.res-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:16px; width:460px; flex-shrink:0; box-shadow:var(--shadow-sm); }
.res-card-header { display:flex; align-items:center; gap:8px; margin-bottom:12px; }

/* Combo Card */
.combo-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:16px; width:500px; flex-shrink:0; box-shadow:var(--shadow-sm); display:flex; flex-direction:column; gap:12px; }
.combo-header { display:flex; align-items:center; gap:8px; }
.combo-icon { font-size:18px; }
.combo-section { display:flex; flex-direction:column; gap:6px; }
.combo-section-label { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:600; color:var(--color-text-secondary); text-transform:uppercase; letter-spacing:0.03em; }
.combo-req-count { font-weight:400; color:var(--color-text-muted); margin-left:auto; }
.combo-resources { display:flex; flex-direction:column; gap:6px; }
.res-tag-list { display:flex; flex-wrap:wrap; gap:6px; }
.res-tag { display:inline-flex; align-items:center; gap:4px; padding:3px 6px 3px 10px; background:var(--color-primary-light); border:1px solid rgba(79,70,229,0.2); border-radius:14px; font-size:12px; color:var(--color-primary); font-weight:500; }
.res-tag-close { display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; border:none; background:rgba(79,70,229,0.15); border-radius:50%; font-size:12px; line-height:1; color:var(--color-primary); cursor:pointer; transition:all 0.15s; padding:0; font-family:inherit; }
.res-tag-close:hover { background:var(--color-danger); color:white; }
.combo-hint { font-size:11px; color:var(--color-text-muted); padding:4px 0; }
.combo-hint.warn { color:var(--color-warning); }

/* Effect Table */
.eff-table { display:flex; flex-direction:column; }
.eff-table-head { display:flex; align-items:center; gap:8px; padding:6px 0; font-size:11px; font-weight:600; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:0.03em; border-bottom:1px solid var(--color-border-light); margin-bottom:6px; }
.eff-table-row { display:flex; align-items:center; gap:8px; padding:4px 0; }
.eff-col-attr { flex:3; min-width:0; }
.eff-col-type { flex:2; min-width:0; }
.eff-col-val { flex:2; min-width:0; }
.eff-col-lvl { flex:1.2; min-width:0; }
.eff-col-act { width:28px; flex-shrink:0; }
.eff-empty { font-size:12px; color:var(--color-text-muted); padding:8px 0; text-align:center; }

/* Buttons */
.add-btn-sm { display:flex; align-items:center; gap:4px; padding:5px 12px; border:1px dashed var(--color-primary); background:var(--color-primary-light); border-radius:var(--radius-sm); font-size:12px; font-weight:500; color:var(--color-primary); cursor:pointer; transition:all 0.15s ease; font-family:inherit; }
.add-btn-sm:hover { background:var(--color-primary); color:white; border-style:solid; }
.delete-btn-sm { width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:var(--radius-sm); color:var(--color-text-muted); cursor:pointer; transition:all 0.15s; flex-shrink:0; }
.delete-btn-sm:hover { background:#fef2f2; color:var(--color-danger); }
.danger-btn { display:flex; align-items:center; gap:6px; padding:6px 14px; border:1px solid var(--color-danger); background:transparent; border-radius:var(--radius-sm); font-size:12px; font-weight:500; color:var(--color-danger); cursor:pointer; transition:all 0.15s; font-family:inherit; }
.danger-btn:hover { background:var(--color-danger); color:white; }

/* Empty States */
.empty-state { display:flex; flex-direction:column; align-items:center; gap:6px; padding:24px; color:var(--color-text-muted); }
.empty-icon { font-size:24px; opacity:0.6; }
.empty-text { font-size:12px; }
.empty-desc { font-size:11px; color:var(--color-text-muted); }
.empty-state-lg { display:flex; flex-direction:column; align-items:center; gap:8px; padding:40px; width:100%; }
.detail-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; }
.empty-icon-lg { font-size:40px; opacity:0.5; }
.empty-title { font-size:16px; font-weight:600; color:var(--color-text-secondary); }
</style>
