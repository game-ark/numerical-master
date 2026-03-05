import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import type {
  RoleConfig,
  RoleAttribute,
  RoleSystemBinding,
  GrowthSystem,
  LevelAttributeData,
  LevelOverviewData
} from '../types/index'
import { useSystemTemplateStore } from './systemTemplate'
import { calculateAllLevelData, calculateLevelOverview } from '../engine/calculator'
import { exportConfigToJSON, importConfigFromJSON } from '../utils/persistence'

const defaultConfig: RoleConfig = {
  name: '默认角色',
  growthFactor: 1,
  attributes: [],
  systemBindings: []
}

export const useRoleConfigStore = defineStore('roleConfig', () => {
  const config = ref<RoleConfig>({ ...defaultConfig })

  /** 当前加载的模板 ID，null 表示非模板状态 */
  const activeTemplateId = ref<string | null>(null)

  /** 从装备解析出实际生效的 GrowthSystem 列表（含组合效果） */
  const resolvedSystems = computed<GrowthSystem[]>(() => {
    const sysStore = useSystemTemplateStore()
    const result: GrowthSystem[] = []
    for (const binding of config.value.systemBindings) {
      const tpl = sysStore.getTemplate(binding.systemTemplateId)
      if (!tpl) continue
      const activeResources = tpl.resources.filter(r => binding.activeResourceIds.includes(r.id))

      // Resolve combo effects: check if all required resources are active
      const activeIdSet = new Set(binding.activeResourceIds)
      const comboResources: typeof activeResources = []
      if (tpl.comboEffects) {
        for (const combo of tpl.comboEffects) {
          if (
            combo.requiredResourceIds.length >= 2 &&
            combo.effects.length > 0 &&
            combo.requiredResourceIds.every(rid => activeIdSet.has(rid))
          ) {
            // Create a virtual resource for this combo
            comboResources.push({
              id: combo.id,
              name: combo.name,
              effects: JSON.parse(JSON.stringify(combo.effects))
            })
          }
        }
      }

      const allResources = [...activeResources, ...comboResources]
      if (allResources.length > 0) {
        result.push({
          id: tpl.id,
          name: tpl.name,
          color: tpl.color,
          resources: JSON.parse(JSON.stringify(allResources))
        })
      }
    }
    return result
  })

  const levelDataMap = computed<Map<string, LevelAttributeData[]>>(() => {
    return calculateAllLevelData(config.value.attributes, config.value.growthFactor, resolvedSystems.value)
  })

  function getAttributeLevelData(attributeId: string): LevelAttributeData[] {
    return levelDataMap.value.get(attributeId) ?? []
  }

  function getLevelOverview(level: number): LevelOverviewData {
    return calculateLevelOverview(config.value.attributes, levelDataMap.value, level)
  }

  function setRoleName(name: string): void { config.value.name = name }
  function setGrowthFactor(factor: number): void { config.value.growthFactor = factor }

  function addAttribute(): void {
    config.value.attributes.push({ id: nanoid(), name: '新属性', initialValue: 0, baseGrowth: 0 })
  }

  function updateAttribute(index: number, partial: Partial<RoleAttribute>): void {
    config.value.attributes[index] = { ...config.value.attributes[index], ...partial }
  }

  function removeAttribute(index: number): void {
    config.value.attributes.splice(index, 1)
  }

  // === System Binding Actions ===
  function addSystemBinding(systemTemplateId: string): void {
    // Prevent duplicate bindings
    if (config.value.systemBindings.some(b => b.systemTemplateId === systemTemplateId)) return
    config.value.systemBindings.push({ systemTemplateId, activeResourceIds: [] })
  }

  function removeSystemBinding(index: number): void {
    config.value.systemBindings.splice(index, 1)
  }

  function toggleResource(bindingIndex: number, resourceId: string): void {
    const binding = config.value.systemBindings[bindingIndex]
    const idx = binding.activeResourceIds.indexOf(resourceId)
    if (idx >= 0) {
      binding.activeResourceIds.splice(idx, 1)
    } else {
      binding.activeResourceIds.push(resourceId)
    }
  }

  function setActiveResources(bindingIndex: number, resourceIds: string[]): void {
    config.value.systemBindings[bindingIndex].activeResourceIds = resourceIds
  }

  function exportConfig(): string {
    return exportConfigToJSON(config.value)
  }

  function importConfig(json: string): { success: boolean; error?: string } {
    const result = importConfigFromJSON(json)
    if (result.success && result.data) {
      config.value = result.data
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  function forceRecalculate(): void {
    config.value = { ...config.value }
  }

  function loadConfig(newConfig: RoleConfig): void {
    config.value = newConfig
    activeTemplateId.value = null
  }

  return {
    config,
    activeTemplateId,
    resolvedSystems,
    levelDataMap,
    getAttributeLevelData,
    getLevelOverview,
    setRoleName,
    setGrowthFactor,
    addAttribute,
    updateAttribute,
    removeAttribute,
    addSystemBinding,
    removeSystemBinding,
    toggleResource,
    setActiveResources,
    exportConfig,
    importConfig,
    forceRecalculate,
    loadConfig
  }
})
