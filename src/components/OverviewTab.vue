<template>
  <div class="overview-tab">
    <!-- Level Selector Card -->
    <div class="level-card">
      <div class="level-left">
        <div class="level-badge">
          <span class="level-num">{{ selectedLevel }}</span>
          <span class="level-text">等级</span>
        </div>
        <el-slider
          v-model="selectedLevel"
          :min="1"
          :max="100"
          :step="1"
          class="level-slider"
          :show-tooltip="false"
        />
      </div>
      <div class="level-right">
        <el-input-number
          v-model="selectedLevel"
          :min="1"
          :max="100"
          :step="1"
          size="small"
          controls-position="right"
          style="width: 90px"
        />
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="overview-body">
      <!-- Left Panel with Tabs -->
      <div class="stats-panel">
        <div class="stats-header">
          <div class="stats-tabs">
            <button class="stats-tab" :class="{ active: statsTab === 'distribution' }" @click="statsTab = 'distribution'">属性分布</button>
            <button class="stats-tab" :class="{ active: statsTab === 'system' }" @click="statsTab = 'system'">系统加成</button>
            <button class="stats-tab" :class="{ active: statsTab === 'detail' }" @click="statsTab = 'detail'">详细加成</button>
          </div>
        </div>
        <div v-if="statsTab === 'distribution'" class="stats-summary">
          总计 <strong>{{ overviewData.grandTotal.toFixed(0) }}</strong>
        </div>

        <!-- Distribution Tab -->
        <div v-show="statsTab === 'distribution'" class="stats-list">
          <div
            v-for="(attr, idx) in overviewData.attributes"
            :key="attr.attributeId"
            class="stat-card"
          >
            <div class="stat-color" :style="{ background: attrColors[idx % attrColors.length] }"></div>
            <div class="stat-info">
              <span class="stat-name">{{ attr.attributeName }}</span>
              <span class="stat-value">{{ attr.totalValue.toFixed(1) }}</span>
            </div>
            <div class="stat-bar-wrap">
              <div
                class="stat-bar"
                :style="{
                  width: attr.percentage + '%',
                  background: attrColors[idx % attrColors.length]
                }"
              ></div>
            </div>
            <span class="stat-pct">{{ attr.percentage.toFixed(1) }}%</span>
          </div>
          <div v-if="overviewData.attributes.length === 0" class="empty-state">
            <span>暂无属性数据</span>
          </div>
        </div>

        <!-- System Bonus Tab -->
        <div v-show="statsTab === 'system'" class="stats-list">
          <template v-if="systemBonusData.length > 0">
            <div v-for="attr in systemBonusData" :key="attr.attributeId" class="bonus-attr-group">
              <div class="bonus-attr-header">
                <span class="bonus-attr-name">{{ attr.attributeName }}</span>
                <span class="bonus-attr-base">基础 {{ attr.baseValue.toFixed(1) }}</span>
                <span class="bonus-attr-total">总计 {{ attr.totalValue.toFixed(1) }}</span>
              </div>
              <template v-if="attr.systems.length > 0">
                <div v-for="sys in attr.systems" :key="sys.systemId" class="bonus-sys-group">
                  <div class="bonus-sys-header">
                    <span class="bonus-sys-dot" :style="{ background: sys.systemColor }"></span>
                    <span class="bonus-sys-name">{{ sys.systemName }}</span>
                    <span class="bonus-sys-val">+{{ sys.totalValue.toFixed(1) }}</span>
                  </div>
                  <div v-for="res in sys.resources.filter(r => r.value !== 0)" :key="res.resourceId" class="bonus-res-row">
                    <span class="bonus-res-name">{{ res.resourceName }}</span>
                    <span class="bonus-res-val" :class="{ negative: res.value < 0 }">{{ res.value >= 0 ? '+' : '' }}{{ res.value.toFixed(1) }}</span>
                  </div>
                </div>
              </template>
              <div v-else class="bonus-no-sys">无系统加成</div>
            </div>
          </template>
          <div v-else class="empty-state">
            <span>暂无属性数据</span>
          </div>
        </div>

        <!-- Detail Bonus Tab (by system) -->
        <div v-show="statsTab === 'detail'" class="stats-list">
          <template v-if="store.resolvedSystems.length > 0">
            <div v-for="sys in store.resolvedSystems" :key="sys.id" class="detail-sys-group">
              <div class="detail-sys-header">
                <span class="bonus-sys-dot" :style="{ background: sys.color }"></span>
                <span class="detail-sys-name">{{ sys.name }}</span>
                <span class="detail-sys-count">{{ sys.resources.length }} 资源</span>
              </div>
              <div v-for="res in sys.resources" :key="res.id" class="detail-res-group">
                <div class="detail-res-header">{{ res.name }}</div>
                <div v-if="res.effects.length > 0" class="detail-eff-list">
                  <div v-for="eff in res.effects" :key="eff.id" class="detail-eff-row">
                    <span class="detail-eff-attr">{{ getAttrName(eff.targetAttributeId) }}</span>
                    <span class="detail-eff-type" :class="eff.type">{{ eff.type === 'fixed' ? '固定值' : '百分比' }}</span>
                    <span class="detail-eff-val" :class="{ negative: eff.value < 0 }">
                      {{ eff.value >= 0 ? '+' : '' }}{{ eff.value }}{{ eff.type === 'percent' ? '%' : '' }}
                    </span>
                  </div>
                </div>
                <div v-else class="bonus-no-sys">无效果</div>
              </div>
            </div>
          </template>
          <div v-else class="empty-state">
            <span>暂无系统加成</span>
          </div>
        </div>
      </div>

      <!-- Pie Chart -->
      <div class="chart-panel">
        <div ref="chartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { useRoleConfigStore } from '../store/roleConfig'
import { useAttributeLibraryStore } from '../store/attributeLibrary'
import * as echarts from 'echarts'
import type { LevelAttributeData } from '../types/index'

const store = useRoleConfigStore()
const libStore = useAttributeLibraryStore()
const selectedLevel = ref(50)
const statsTab = ref<'distribution' | 'system' | 'detail'>('distribution')
const chartRef = ref<HTMLElement | null>(null)
const chartInstance = shallowRef<echarts.ECharts | null>(null)
let resizeObserver: ResizeObserver | null = null

const attrColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

const overviewData = computed(() => store.getLevelOverview(selectedLevel.value))

const systemBonusData = computed<LevelAttributeData[]>(() => {
  return store.config.attributes.map(attr => {
    const allLevels = store.getAttributeLevelData(attr.id)
    return allLevels[selectedLevel.value - 1] ?? null
  }).filter((d): d is LevelAttributeData => d !== null)
})

function getAttrName(attrId: string): string {
  return libStore.getAttributeName(attrId)
}

function getChartOption(): echarts.EChartsOption {
  const attrs = overviewData.value.attributes
  return {
    animation: false,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      padding: [8, 12],
    },
    legend: {
      show: false,
    },
    series: [{
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 3,
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%',
        fontSize: 11,
        color: '#64748b',
        lineHeight: 16,
      },
      emphasis: {
        label: { show: true, fontSize: 13, fontWeight: 'bold' },
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' },
      },
      data: attrs.map((a, i) => ({
        name: a.attributeName,
        value: Number(a.totalValue.toFixed(2)),
        itemStyle: { color: attrColors[i % attrColors.length] },
      })),
    }],
  }
}

function updateChart() {
  if (chartInstance.value) chartInstance.value.setOption(getChartOption(), { notMerge: true, lazyUpdate: false })
}

onMounted(() => {
  if (chartRef.value) {
    chartInstance.value = echarts.init(chartRef.value)
    chartInstance.value.setOption(getChartOption())
    resizeObserver = new ResizeObserver(() => { chartInstance.value?.resize() })
    resizeObserver.observe(chartRef.value)
  }
})

watch(selectedLevel, () => updateChart())
watch(() => store.config, () => updateChart(), { deep: true })

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chartInstance.value?.dispose()
})
</script>

<style scoped>
.overview-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

/* ===== Level Card ===== */
.level-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.level-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.level-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 12px;
  background: var(--color-primary-light);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.level-num {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}

.level-text {
  font-size: 10px;
  color: var(--color-primary);
  font-weight: 500;
  margin-top: 2px;
}

.level-slider {
  flex: 1;
}

.level-right {
  flex-shrink: 0;
}

/* ===== Body ===== */
.overview-body {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

/* Stats Panel */
.stats-panel {
  width: 320px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.stats-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.stats-summary {
  padding: 8px 16px;
  font-size: 12px;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.stats-summary strong {
  color: var(--color-text);
  font-weight: 700;
}

.stats-tabs {
  display: flex;
  gap: 2px;
  background: var(--color-border-light);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.stats-tab {
  padding: 4px 12px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.stats-tab:hover {
  color: var(--color-text);
}

.stats-tab.active {
  background: var(--color-surface);
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}

.stats-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  transition: background 0.1s;
}

.stat-card:hover {
  background: var(--color-border-light);
}

.stat-color {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 70px;
}

.stat-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.stat-value {
  font-size: 11px;
  color: var(--color-text-muted);
}

.stat-bar-wrap {
  flex: 1;
  height: 6px;
  background: var(--color-border-light);
  border-radius: 3px;
  overflow: hidden;
}

.stat-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.stat-pct {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  min-width: 42px;
  text-align: right;
}

/* Chart Panel */
.chart-panel {
  flex: 1;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  min-width: 0;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

/* ===== System Bonus ===== */
.bonus-attr-group {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.bonus-attr-group:last-child {
  border-bottom: none;
}

.bonus-attr-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  margin-bottom: 4px;
}

.bonus-attr-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  flex: 1;
}

.bonus-attr-base {
  font-size: 11px;
  color: var(--color-text-muted);
}

.bonus-attr-total {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
}

.bonus-sys-group {
  margin-left: 8px;
  margin-bottom: 2px;
}

.bonus-sys-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
}

.bonus-sys-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bonus-sys-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  flex: 1;
}

.bonus-sys-val {
  font-size: 12px;
  font-weight: 600;
  color: #10b981;
}

.bonus-res-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 8px 2px 28px;
}

.bonus-res-name {
  font-size: 11px;
  color: var(--color-text-muted);
}

.bonus-res-val {
  font-size: 11px;
  font-weight: 500;
  color: #10b981;
}

.bonus-res-val.negative {
  color: var(--color-danger);
}

.bonus-no-sys {
  font-size: 11px;
  color: var(--color-text-muted);
  padding: 2px 8px 2px 16px;
}

/* ===== Detail Bonus ===== */
.detail-sys-group {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-sys-group:last-child {
  border-bottom: none;
}

.detail-sys-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  margin-bottom: 6px;
}

.detail-sys-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  flex: 1;
}

.detail-sys-count {
  font-size: 11px;
  color: var(--color-text-muted);
}

.detail-res-group {
  margin-left: 8px;
  margin-bottom: 6px;
}

.detail-res-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 2px 8px;
  margin-bottom: 2px;
}

.detail-eff-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.detail-eff-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px 2px 20px;
}

.detail-eff-attr {
  font-size: 11px;
  color: var(--color-text);
  flex: 1;
}

.detail-eff-type {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 8px;
  flex-shrink: 0;
}

.detail-eff-type.fixed {
  background: #eff6ff;
  color: #3b82f6;
}

.detail-eff-type.percent {
  background: #fef3c7;
  color: #d97706;
}

.detail-eff-val {
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  min-width: 50px;
  text-align: right;
}

.detail-eff-val.negative {
  color: var(--color-danger);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 13px;
}
</style>
