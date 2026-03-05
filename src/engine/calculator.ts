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
 * 计算单个效果对目标属性的贡献值
 */
export function calculateEffectContribution(effect: Effect, baseValue: number): number {
  if (effect.type === 'fixed') return effect.value
  return baseValue * effect.value / 100
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
      let totalSystemContribution = 0
      const sysList: SystemContribution[] = []

      for (const system of systems) {
        const resources: ResourceContribution[] = []
        let systemTotal = 0

        for (const resource of system.resources) {
          let resourceTotal = 0
          for (const effect of resource.effects) {
            if (effect.targetAttributeId === attr.id) {
              resourceTotal += calculateEffectContribution(effect, baseValue)
            }
          }
          systemTotal += resourceTotal
          resources.push({ resourceId: resource.id, resourceName: resource.name, value: resourceTotal, percentage: 0 })
        }

        totalSystemContribution += systemTotal
        sysList.push({
          systemId: system.id, systemName: system.name, systemColor: system.color,
          resources, totalValue: systemTotal, percentage: 0
        })
      }

      const totalValue = baseValue + totalSystemContribution
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
