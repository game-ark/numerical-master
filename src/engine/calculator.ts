import type {
  RoleAttribute,
  Effect,
  GrowthSystem,
  ResourceContribution,
  SystemContribution,
  LevelAttributeData,
  LevelOverviewData
} from '../types/index'

/**
 * 计算某属性在某等级的基础属性值
 * 公式：基础属性值 = 初始属性值 + (等级 - 1) × 基础成长值 × 成长系数
 */
export function calculateBaseValue(attr: RoleAttribute, level: number, growthFactor: number): number {
  return attr.initialValue + (level - 1) * attr.baseGrowth * growthFactor
}

/**
 * 收集某属性的所有效果，按级别分层计算：
 * 1. 所有固定值直接加到基础值上
 * 2. 同级别的百分比加法合并，不同级别乘法叠加
 *
 * 例：基础100，级别1百分比10%+10%=20%，级别2百分比10%
 * 结果 = (100 + 固定值) * (1 + 0.2) * (1 + 0.1)
 */
export function calculateAttributeTotal(
  baseValue: number,
  effects: Effect[]
): number {
  // Sum all fixed effects
  let fixedSum = 0
  // Group percent effects by level
  const percentByLevel = new Map<number, number>()

  for (const eff of effects) {
    if (eff.type === 'fixed') {
      fixedSum += eff.value
    } else {
      const prev = percentByLevel.get(eff.level) ?? 0
      percentByLevel.set(eff.level, prev + eff.value)
    }
  }

  // Start with base + fixed
  let result = baseValue + fixedSum

  // Apply percent levels in ascending order (multiply)
  const sortedLevels = Array.from(percentByLevel.keys()).sort((a, b) => a - b)
  for (const lvl of sortedLevels) {
    result *= (1 + percentByLevel.get(lvl)! / 100)
  }

  return result
}

/**
 * 计算所有等级所有属性的完整数据
 * 接受已解析的 GrowthSystem[]（由 store 从装备解析生成）
 */
export function calculateAllLevelData(
  attributes: RoleAttribute[],
  growthFactor: number,
  systems: GrowthSystem[]
): Map<string, LevelAttributeData[]> {
  const result = new Map<string, LevelAttributeData[]>()

  for (const attr of attributes) {
    const levelDataList: LevelAttributeData[] = []

    for (let level = 1; level <= 100; level++) {
      const baseValue = calculateBaseValue(attr, level, growthFactor)

      // Collect all effects targeting this attribute
      const allEffects: Effect[] = []
      const resourceEffectsMap = new Map<string, Effect[]>()

      for (const system of systems) {
        for (const resource of system.resources) {
          const matched = resource.effects.filter(e => e.targetAttributeId === attr.id)
          if (matched.length > 0) {
            resourceEffectsMap.set(`${system.id}:${resource.id}`, matched)
            allEffects.push(...matched)
          }
        }
      }

      // Calculate total using the new level-based formula
      const totalValue = calculateAttributeTotal(baseValue, allEffects)

      // === Accurate per-resource contribution calculation ===
      // Each resource's contribution accounts for level-based multiplicative stacking.
      //
      // Step 1: Fixed effects contribute their face value directly.
      // Step 2: For each percent level (ascending), compute the layer's multiplier
      //         from all effects at that level, then distribute the layer's gain
      //         proportionally to each resource's share of that level's total percent.

      // Track per-resource contribution
      const resourceContribMap = new Map<string, number>() // key -> contribution

      // Step 1: Fixed contributions
      for (const [key, effs] of resourceEffectsMap) {
        let fixedTotal = 0
        for (const eff of effs) {
          if (eff.type === 'fixed') fixedTotal += eff.value
        }
        resourceContribMap.set(key, (resourceContribMap.get(key) ?? 0) + fixedTotal)
      }

      // Step 2: Percent contributions by level
      // Gather all percent effects grouped by level, tracking which resource they belong to
      const percentByLevel = new Map<number, { key: string; value: number }[]>()
      for (const [key, effs] of resourceEffectsMap) {
        for (const eff of effs) {
          if (eff.type === 'percent') {
            if (!percentByLevel.has(eff.level)) percentByLevel.set(eff.level, [])
            percentByLevel.get(eff.level)!.push({ key, value: eff.value })
          }
        }
      }

      // Compute afterFixed (base + all fixed effects)
      let afterFixed = baseValue
      for (const effs of resourceEffectsMap.values()) {
        for (const eff of effs) {
          if (eff.type === 'fixed') afterFixed += eff.value
        }
      }

      // Walk levels in ascending order
      const sortedLevels = Array.from(percentByLevel.keys()).sort((a, b) => a - b)
      let currentValue = afterFixed
      for (const lvl of sortedLevels) {
        const entries = percentByLevel.get(lvl)!
        const levelTotalPercent = entries.reduce((sum, e) => sum + e.value, 0)
        const layerGain = currentValue * levelTotalPercent / 100 // total gain from this level
        // Distribute proportionally
        if (levelTotalPercent !== 0) {
          for (const entry of entries) {
            const share = layerGain * (entry.value / levelTotalPercent)
            resourceContribMap.set(entry.key, (resourceContribMap.get(entry.key) ?? 0) + share)
          }
        }
        currentValue *= (1 + levelTotalPercent / 100)
      }

      // Build per-system / per-resource contribution info
      const sysList: SystemContribution[] = []
      for (const system of systems) {
        const resources: ResourceContribution[] = []
        let systemTotal = 0

        for (const resource of system.resources) {
          const key = `${system.id}:${resource.id}`
          const contrib = resourceContribMap.get(key) ?? 0
          systemTotal += contrib
          resources.push({ resourceId: resource.id, resourceName: resource.name, value: contrib, percentage: 0 })
        }

        if (resources.length > 0) {
          sysList.push({
            systemId: system.id, systemName: system.name, systemColor: system.color,
            resources, totalValue: systemTotal, percentage: 0
          })
        }
      }

      const basePercentage = totalValue > 0 ? Number((baseValue / totalValue * 100).toFixed(2)) : 0
      for (const sys of sysList) {
        sys.percentage = totalValue > 0 ? Number((sys.totalValue / totalValue * 100).toFixed(2)) : 0
        for (const res of sys.resources) {
          res.percentage = totalValue > 0 ? Number((res.value / totalValue * 100).toFixed(2)) : 0
        }
      }

      levelDataList.push({
        level, attributeId: attr.id, attributeName: attr.name,
        baseValue, basePercentage, systems: sysList, totalValue
      })
    }
    result.set(attr.id, levelDataList)
  }
  return result
}

/**
 * 计算某等级的总览数据
 */
export function calculateLevelOverview(
  attributes: RoleAttribute[],
  levelDataMap: Map<string, LevelAttributeData[]>,
  level: number
): LevelOverviewData {
  const attrResults: LevelOverviewData['attributes'] = []
  let grandTotal = 0

  for (const attr of attributes) {
    const levelData = levelDataMap.get(attr.id)?.[level - 1]
    const totalValue = levelData?.totalValue ?? 0
    grandTotal += totalValue
    attrResults.push({ attributeId: attr.id, attributeName: attr.name, totalValue, percentage: 0 })
  }

  for (const a of attrResults) {
    a.percentage = grandTotal > 0 ? Number((a.totalValue / grandTotal * 100).toFixed(2)) : 0
  }

  return { level, attributes: attrResults, grandTotal }
}
