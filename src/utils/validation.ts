export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateInitialValue(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0
}

export function validateBaseGrowth(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0
}

export function validateGrowthFactor(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value > 0
}

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

export function validateRoleConfig(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!isObject(data)) {
    errors.push('配置必须是一个对象')
    return { valid: false, errors }
  }

  if (typeof data.name !== 'string') {
    errors.push('缺少有效的 name 字段（字符串）')
  }

  if (!validateGrowthFactor(data.growthFactor as number)) {
    errors.push('growthFactor 必须是 > 0 的数值')
  }

  if (!Array.isArray(data.attributes)) {
    errors.push('缺少有效的 attributes 字段（数组）')
    return { valid: false, errors }
  }

  if (!Array.isArray(data.systemBindings)) {
    errors.push('缺少有效的 systemBindings 字段（数组）')
    return { valid: false, errors }
  }

  const allIds = new Set<string>()

  for (let i = 0; i < data.attributes.length; i++) {
    const attr = data.attributes[i]
    const prefix = `attributes[${i}]`

    if (!isObject(attr)) { errors.push(`${prefix} 必须是一个对象`); continue }
    if (typeof attr.id !== 'string' || attr.id === '') {
      errors.push(`${prefix}.id 必须是非空字符串`)
    } else {
      if (allIds.has(attr.id as string)) errors.push(`${prefix}.id "${attr.id}" 重复`)
      allIds.add(attr.id as string)
    }
    if (typeof attr.name !== 'string') errors.push(`${prefix}.name 必须是字符串`)
    if (!validateInitialValue(attr.initialValue as number)) errors.push(`${prefix}.initialValue 必须是 ≥ 0 的数值`)
    if (!validateBaseGrowth(attr.baseGrowth as number)) errors.push(`${prefix}.baseGrowth 必须是 ≥ 0 的数值`)
  }

  for (let i = 0; i < data.systemBindings.length; i++) {
    const binding = data.systemBindings[i]
    const prefix = `systemBindings[${i}]`
    if (!isObject(binding)) { errors.push(`${prefix} 必须是一个对象`); continue }
    if (typeof binding.systemTemplateId !== 'string' || binding.systemTemplateId === '') {
      errors.push(`${prefix}.systemTemplateId 必须是非空字符串`)
    }
    if (!Array.isArray(binding.activeResourceIds)) {
      errors.push(`${prefix}.activeResourceIds 必须是数组`)
    }
  }

  return { valid: errors.length === 0, errors }
}
