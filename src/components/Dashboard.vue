<template>
  <div class="dashboard">
    <!-- Dashboard Tabs -->
    <div class="dash-tabs-bar">
      <button
        class="dash-tab"
        :class="{ active: activeTab === 'overview' }"
        @click="activeTab = 'overview'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
        总览
      </button>
      <div class="tab-divider"></div>
      <button
        v-for="attr in store.config.attributes"
        :key="attr.id"
        class="dash-tab"
        :class="{ active: activeTab === attr.id }"
        @click="activeTab = attr.id"
      >
        {{ attr.name }}
      </button>
      <div v-if="store.config.attributes.length === 0" class="tab-hint">
        添加属性后将显示对应图表
      </div>
    </div>

    <!-- Tab Content -->
    <div class="dash-content">
      <OverviewTab v-if="activeTab === 'overview'" />
      <div v-else class="chart-container">
        <AttributeStackedBarChart :attribute-id="activeTab" :key="activeTab" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoleConfigStore } from '../store/roleConfig'
import OverviewTab from './OverviewTab.vue'
import AttributeStackedBarChart from './AttributeStackedBarChart.vue'

const store = useRoleConfigStore()
const activeTab = ref('overview')

// Reset to overview if active attribute is removed
watch(() => store.config.attributes, (attrs) => {
  if (activeTab.value !== 'overview' && !attrs.some(a => a.id === activeTab.value)) {
    activeTab.value = 'overview'
  }
}, { deep: true })
</script>

<style scoped>
.dashboard {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dash-tabs-bar {
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 2px;
  height: 48px;
  min-height: 48px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  flex-shrink: 0;
}

.dash-tabs-bar::-webkit-scrollbar {
  height: 0;
}

.dash-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  font-family: inherit;
}

.dash-tab:hover {
  background: var(--color-border-light);
  color: var(--color-text);
}

.dash-tab.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}

.tab-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 6px;
  flex-shrink: 0;
}

.tab-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 0 8px;
}

.dash-content {
  flex: 1;
  overflow: hidden;
  padding: 16px 20px;
}

.chart-container {
  height: 100%;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}
</style>
