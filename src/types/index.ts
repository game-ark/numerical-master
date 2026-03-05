/** 角色属性定义 */
export interface RoleAttribute {
  id: string           // 唯一标识 (nanoid)
  name: string         // 属性名称，如 "HP", "ATK"
  initialValue: number // 初始属性值 (≥ 0)
  baseGrowth: number   // 基础成长值 (≥ 0)
}

/** 效果定义 */
export interface Effect {
  id: string
  targetAttributeId: string  // 目标属性 ID
  type: 'fixed' | 'percent' // 加成类型
  value: number              // 固定值或百分比值
  level: number              // 效果级别，同级百分比加法合并，不同级乘法叠加
}

/** 资源定义 */
export interface Resource {
  id: string
  name: string       // 资源名称
  effects: Effect[]  // 效果列表
}

/** 组合效果定义：当指定的多个资源同时激活时，额外触发的效果 */
export interface ComboEffect {
  id: string
  name: string                // 组合名称，如 "武器+护甲套装"
  requiredResourceIds: string[] // 需要同时激活的资源 ID 列表
  effects: Effect[]           // 满足条件时额外触发的效果列表
}

/** 系统模板（独立配置，存储在模板库中） */
export interface SystemTemplate {
  id: string
  name: string           // 系统名称
  color: string          // 系统颜色 (hex)
  resources: Resource[]  // 可用资源列表
  comboEffects: ComboEffect[] // 组合效果列表
}

/** 角色的系统装备（引用系统模板 + 选中的资源） */
export interface RoleSystemBinding {
  systemTemplateId: string    // 引用的系统模板 ID
  activeResourceIds: string[] // 选中生效的资源 ID 列表
}

/** 成长系统定义（计算用，由装备解析生成） */
export interface GrowthSystem {
  id: string
  name: string
  color: string
  resources: Resource[]
}

/** 角色配置（完整） */
export interface RoleConfig {
  name: string                       // 角色名称
  growthFactor: number               // 成长系数 (全局乘数，> 0)
  attributes: RoleAttribute[]         // 属性列表
  systemBindings: RoleSystemBinding[] // 系统装备列表
}

/** 属性模板（完整配置快照） */
export interface AttributeTemplate {
  id: string
  name: string
  roleName: string
  growthFactor: number
  attributes: RoleAttribute[]
}

// ============ 计算结果类型 ============

/** 单个资源对某属性的贡献 */
export interface ResourceContribution {
  resourceId: string
  resourceName: string
  value: number
  percentage: number
}

/** 单个系统对某属性的贡献 */
export interface SystemContribution {
  systemId: string
  systemName: string
  systemColor: string
  resources: ResourceContribution[]
  totalValue: number
  percentage: number
}

/** 某等级某属性的完整数据 */
export interface LevelAttributeData {
  level: number
  attributeId: string
  attributeName: string
  baseValue: number
  basePercentage: number
  systems: SystemContribution[]
  totalValue: number
}

/** 某等级所有属性的数据（用于总览） */
export interface LevelOverviewData {
  level: number
  attributes: {
    attributeId: string
    attributeName: string
    totalValue: number
    percentage: number
  }[]
  grandTotal: number
}
