<template>
  <div class="attr-detail">
    <!-- Stats Header -->
    <div class="stats-row">
      <div class="stat-chip">
        <span class="stat-chip-label">Lv.1</span>
        <span class="stat-chip-value">{{ formatNum(lv1Data?.totalValue) }}</span>
      </div>
      <div class="stat-chip">
        <span class="stat-chip-label">Lv.50</span>
        <span class="stat-chip-value">{{ formatNum(lv50Data?.totalValue) }}</span>
      </div>
      <div class="stat-chip highlight">
        <span class="stat-chip-label">Lv.100</span>
        <span class="stat-chip-value">{{ formatNum(lv100Data?.totalValue) }}</span>
      </div>
      <div class="stat-chip">
        <span class="stat-chip-label">每级成长</span>
        <span class="stat-chip-value">+{{ formatNum(growthPerLevel) }}</span>
      </div>
      <div class="stat-chip">
        <span class="stat-chip-label">基础占比 (Lv.100)</span>
        <span class="stat-chip-value">{{ lv100Data?.basePercentage.toFixed(1) ?? 0 }}%</span>
      </div>
      <div class="stat-chip">
        <span class="stat-chip-label">系统加成 (Lv.100)</span>
        <span class="stat-chip-value">{{ systemBoostPct }}%</span>
      </div>
    </div>
    <!-- Chart -->
    <div class="chart-area" ref="chartRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { useRoleConfigStore } from '../store/roleConfig'
import * as echarts from 'echarts'
import type { LevelAttributeData, GrowthSystem } from '../types/index'

const props = defineProps<{ attributeId: string }>()
const store = useRoleConfigStore()
const chartRef = ref<HTMLElement | null>(null)
const chartInstance = shallowRef<echarts.ECharts | null>(null)
let resizeObserver: ResizeObserver | null = null

const levelDataList = computed<LevelAttributeData[]>(() => store.getAttributeLevelData(props.attributeId))
const systems = computed<GrowthSystem[]>(() => store.resolvedSystems)

const lv1Data = computed(() => levelDataList.value[0])
const lv50Data = computed(() => levelDataList.value[49])
const lv100Data = computed(() => levelDataList.value[99])

const growthPerLevel = computed(() => {
  const d = levelDataList.value
  if (d.length < 2) return 0
  return (d[d.length - 1].totalValue - d[0].totalValue) / 99
})

const systemBoostPct = computed(() => {
  const d = lv100Data.value
  if (!d || d.totalValue === 0) return '0.0'
  return (100 - d.basePercentage).toFixed(1)
})

function formatNum(v: number | undefined): string {
  if (v === undefined || v === null) return '0'
  if (v >= 10000) return (v / 1000).toFixed(1) + 'k'
  return v.toFixed(1)
}

// Palette: soft gradient-friendly colors
const baseColor = '#94a3b8'
const baseColorLight = 'rgba(148,163,184,0.35)'
const trendColor = '#6366f1'

function makeCustomBarSeries(
  name: string,
  color: string,
  colorLight: string,
  valuesGetter: (idx: number) => number,
  stackBottomGetter: (idx: number) => number,
  dataLen: number
): echarts.CustomSeriesOption {
  return {
    name,
    type: 'custom',
    renderItem: (_params: any, api: any) => {
      const idx = api.value(0) as number
      const bottom = stackBottomGetter(idx - 1)
      const top = bottom + valuesGetter(idx - 1)
      const leftBottom = api.coord([idx, bottom])
      const rightTop = api.coord([idx + 1, top])
      const height = leftBottom[1] - rightTop[1]
      return {
        type: 'rect',
        shape: {
          x: leftBottom[0],
          y: rightTop[1],
          width: rightTop[0] - leftBottom[0],
          height: height,
        },
        style: {
          fill: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color },
            { offset: 1, color: colorLight },
          ]),
        },
      }
    },
    data: Array.from({ length: dataLen }, (_, i) => [i + 1, valuesGetter(i)]),
    z: 2,
  }
}

function getChartOption(): echarts.EChartsOption {
  const data = levelDataList.value
  const sysList = systems.value

  if (data.length === 0) {
    return { xAxis: { type: 'value' }, yAxis: { type: 'value' }, series: [] }
  }

  const stackBottoms: number[][] = Array.from({ length: 1 + sysList.length }, () => new Array(data.length).fill(0))
  for (let i = 0; i < data.length; i++) {
    let cumulative = data[i].baseValue
    for (let s = 0; s < sysList.length; s++) {
      stackBottoms[s + 1][i] = cumulative
      const sys = data[i].systems.find(sc => sc.systemId === sysList[s].id)
      cumulative += sys?.totalValue ?? 0
    }
  }

  const baseSeries = makeCustomBarSeries(
    '基础属性', baseColor, baseColorLight,
    (idx) => data[idx].baseValue,
    (idx) => stackBottoms[0][idx],
    data.length
  )

  // Generate lighter gradient variants for system colors
  const systemSeriesList = sysList.map((system, sIdx) => {
    const lightColor = system.color + '55' // ~33% opacity hex
    return makeCustomBarSeries(
      system.name, system.color, lightColor,
      (idx) => {
        const sys = data[idx].systems.find(sc => sc.systemId === system.id)
        return sys?.totalValue ?? 0
      },
      (idx) => stackBottoms[sIdx + 1][idx],
      data.length
    )
  })

  // Trend line with area fill
  const trendSeries: echarts.LineSeriesOption = {
    name: '总值趋势',
    type: 'line',
    data: data.map(d => [d.level, d.totalValue]),
    smooth: 0.3,
    symbol: 'none',
    lineStyle: { width: 2.5, color: trendColor, shadowColor: 'rgba(99,102,241,0.25)', shadowBlur: 8 },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(99,102,241,0.12)' },
        { offset: 1, color: 'rgba(99,102,241,0.01)' },
      ]),
    },
    z: 10,
  }

  // Mark points at key levels
  const markSeries: echarts.LineSeriesOption = {
    name: '关键等级',
    type: 'line',
    data: [],
    symbol: 'none',
    lineStyle: { width: 0 },
    markPoint: {
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: trendColor, borderColor: '#fff', borderWidth: 2 },
      label: {
        show: true,
        position: 'top',
        formatter: (p: any) => 'Lv.' + p.data.xAxis,
        fontSize: 10,
        color: '#64748b',
        distance: 12,
      },
      data: [
        { xAxis: 1, yAxis: data[0].totalValue },
        { xAxis: 50, yAxis: data[49].totalValue },
        { xAxis: 100, yAxis: data[99].totalValue },
      ],
    },
    z: 11,
  }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: { color: '#e2e8f0' },
        lineStyle: { color: '#c7d2fe', type: 'dashed' },
        label: { backgroundColor: '#6366f1' },
      },
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      borderRadius: 10,
      textStyle: { color: '#1e293b', fontSize: 12 },
      padding: [12, 16],
      extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.1);',
      formatter: (params: unknown) => {
        const paramArr = params as { dataIndex: number; value: any }[]
        if (!paramArr || paramArr.length === 0) return ''
        const firstVal = paramArr[0].value
        const level = Array.isArray(firstVal) ? firstVal[0] : firstVal
        const levelData = data.find(d => d.level === level)
        if (!levelData) return ''

        let html = `<div style="font-size:14px;font-weight:700;margin-bottom:8px;color:#1e293b">Lv.${levelData.level}</div>`
        html += `<div style="display:flex;justify-content:space-between;gap:20px;padding:4px 0;border-bottom:1px solid #f1f5f9"><span style="color:${baseColor}">● 基础属性</span><span style="font-weight:600">${levelData.baseValue.toFixed(1)} <span style="color:#94a3b8;font-size:11px;font-weight:400">${levelData.basePercentage.toFixed(1)}%</span></span></div>`

        for (const sysContrib of levelData.systems) {
          html += `<div style="display:flex;justify-content:space-between;gap:20px;padding:4px 0"><span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${sysContrib.systemColor};margin-right:6px;vertical-align:middle"></span>${sysContrib.systemName}</span><span style="font-weight:600">${sysContrib.totalValue.toFixed(1)} <span style="color:#94a3b8;font-size:11px;font-weight:400">${sysContrib.percentage.toFixed(1)}%</span></span></div>`
          for (const res of sysContrib.resources) {
            if (res.value !== 0) {
              html += `<div style="display:flex;justify-content:space-between;gap:20px;padding:2px 0 2px 20px;color:#94a3b8;font-size:11px"><span>└ ${res.resourceName}</span><span>${res.value.toFixed(1)}</span></div>`
            }
          }
        }

        html += `<div style="border-top:1px solid #e2e8f0;margin-top:6px;padding-top:8px;font-size:14px;font-weight:700;display:flex;justify-content:space-between;color:#4f46e5"><span>总值</span><span>${levelData.totalValue.toFixed(1)}</span></div>`
        return html
      },
    },
    legend: {
      data: ['基础属性', ...sysList.map(s => s.name), '总值趋势'],
      top: 4,
      left: 'center',
      textStyle: { fontSize: 12, color: '#64748b' },
      itemWidth: 16,
      itemHeight: 8,
      itemGap: 20,
      icon: 'roundRect',
    },
    grid: { left: 60, right: 40, bottom: 60, top: 50 },
    xAxis: {
      type: 'value',
      min: 1,
      max: 101,
      interval: 1,
      name: '等级',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: '#94a3b8', fontSize: 12, fontWeight: 500 },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        margin: 10,
        formatter: (value: number) => {
          if (value > 100) return ''
          if (value % 10 === 0 || value === 1) return String(value)
          return ''
        },
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '属性值',
      nameLocation: 'middle',
      nameGap: 45,
      nameTextStyle: { color: '#94a3b8', fontSize: 12, fontWeight: 500 },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: (v: number) => {
          if (v >= 10000) return (v / 1000).toFixed(0) + 'k'
          return String(v)
        },
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        height: 20,
        bottom: 6,
        borderColor: 'transparent',
        backgroundColor: '#f8fafc',
        fillerColor: 'rgba(99,102,241,0.1)',
        handleStyle: { color: '#6366f1', borderColor: '#6366f1' },
        handleSize: '60%',
        dataBackground: {
          lineStyle: { color: '#c7d2fe' },
          areaStyle: { color: 'rgba(199,210,254,0.3)' },
        },
        selectedDataBackground: {
          lineStyle: { color: '#6366f1' },
          areaStyle: { color: 'rgba(99,102,241,0.15)' },
        },
        textStyle: { color: '#94a3b8', fontSize: 10 },
      },
      { type: 'inside', xAxisIndex: 0 },
    ],
    series: [baseSeries, ...systemSeriesList, trendSeries, markSeries],
    animationDuration: 600,
    animationEasing: 'cubicOut',
  } as echarts.EChartsOption
}

function updateChart() {
  if (chartInstance.value) chartInstance.value.setOption(getChartOption(), true)
}

onMounted(() => {
  if (chartRef.value) {
    chartInstance.value = echarts.init(chartRef.value)
    chartInstance.value.setOption(getChartOption())
    resizeObserver = new ResizeObserver(() => { chartInstance.value?.resize() })
    resizeObserver.observe(chartRef.value)
  }
})

watch([levelDataList, systems], () => updateChart(), { deep: true })

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chartInstance.value?.dispose()
})
</script>

<style scoped>
.attr-detail {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

/* ===== Stats Row ===== */
.stats-row {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 14px;
  background: var(--color-border-light);
  border-radius: var(--radius-md);
  min-width: 0;
  flex: 1;
  min-width: 90px;
}

.stat-chip.highlight {
  background: var(--color-primary-light);
}

.stat-chip.highlight .stat-chip-value {
  color: var(--color-primary);
}

.stat-chip-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-chip-value {
  font-size: 16px;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.2;
}

/* ===== Chart ===== */
.chart-area {
  flex: 1;
  min-height: 0;
  border-radius: var(--radius-md);
}
</style>
