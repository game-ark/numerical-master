import { describe, it, expect } from 'vitest'
import {
  validateRoleConfig,
  validateInitialValue,
  validateBaseGrowth,
  validateGrowthFactor,
} from '../validation'

describe('validateInitialValue', () => {
  it('accepts 0', () => expect(validateInitialValue(0)).toBe(true))
  it('accepts positive', () => expect(validateInitialValue(100)).toBe(true))
  it('rejects negative', () => expect(validateInitialValue(-1)).toBe(false))
  it('rejects NaN', () => expect(validateInitialValue(NaN)).toBe(false))
})

describe('validateBaseGrowth', () => {
  it('accepts 0', () => expect(validateBaseGrowth(0)).toBe(true))
  it('accepts positive', () => expect(validateBaseGrowth(5.5)).toBe(true))
  it('rejects negative', () => expect(validateBaseGrowth(-0.1)).toBe(false))
  it('rejects NaN', () => expect(validateBaseGrowth(NaN)).toBe(false))
})

describe('validateGrowthFactor', () => {
  it('accepts positive', () => expect(validateGrowthFactor(1.2)).toBe(true))
  it('accepts small positive', () => expect(validateGrowthFactor(0.001)).toBe(true))
  it('rejects 0', () => expect(validateGrowthFactor(0)).toBe(false))
  it('rejects negative', () => expect(validateGrowthFactor(-1)).toBe(false))
  it('rejects NaN', () => expect(validateGrowthFactor(NaN)).toBe(false))
})

describe('validateRoleConfig', () => {
  const validConfig = {
    name: '测试角色',
    growthFactor: 1.2,
    attributes: [
      { id: 'attr1', name: 'HP', initialValue: 100, baseGrowth: 10 },
    ],
    systemBindings: [
      { systemTemplateId: 'sys1', activeResourceIds: ['res1'] },
    ],
  }

  it('accepts a valid config', () => {
    const result = validateRoleConfig(validConfig)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects non-object input', () => {
    expect(validateRoleConfig(null).valid).toBe(false)
    expect(validateRoleConfig('string').valid).toBe(false)
    expect(validateRoleConfig(42).valid).toBe(false)
    expect(validateRoleConfig(undefined).valid).toBe(false)
  })

  it('rejects missing name', () => {
    const result = validateRoleConfig({ ...validConfig, name: 123 })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('name'))).toBe(true)
  })

  it('rejects missing attributes array', () => {
    const result = validateRoleConfig({ ...validConfig, attributes: 'not-array' })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('attributes'))).toBe(true)
  })

  it('rejects missing systemBindings array', () => {
    const result = validateRoleConfig({ ...validConfig, systemBindings: null })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('systemBindings'))).toBe(true)
  })

  it('rejects negative initialValue', () => {
    const config = { ...validConfig, attributes: [{ id: 'a1', name: 'HP', initialValue: -1, baseGrowth: 10 }] }
    expect(validateRoleConfig(config).valid).toBe(false)
  })

  it('rejects negative baseGrowth', () => {
    const config = { ...validConfig, attributes: [{ id: 'a1', name: 'HP', initialValue: 0, baseGrowth: -5 }] }
    expect(validateRoleConfig(config).valid).toBe(false)
  })

  it('rejects zero growthFactor', () => {
    const config = { ...validConfig, growthFactor: 0 }
    expect(validateRoleConfig(config).valid).toBe(false)
  })

  it('rejects duplicate attribute IDs', () => {
    const config = {
      ...validConfig,
      attributes: [
        { id: 'dup', name: 'HP', initialValue: 0, baseGrowth: 0 },
        { id: 'dup', name: 'ATK', initialValue: 0, baseGrowth: 0 },
      ],
    }
    const result = validateRoleConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('重复'))).toBe(true)
  })

  it('rejects invalid systemBinding', () => {
    const config = { ...validConfig, systemBindings: [{ systemTemplateId: '', activeResourceIds: [] }] }
    expect(validateRoleConfig(config).valid).toBe(false)
  })

  it('collects multiple errors', () => {
    const config = {
      name: 123,
      growthFactor: 0,
      attributes: [{ id: '', name: 42, initialValue: -1, baseGrowth: -1 }],
      systemBindings: [],
    }
    const result = validateRoleConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(1)
  })

  it('accepts config with empty systemBindings', () => {
    const config = {
      name: 'test',
      growthFactor: 1,
      attributes: [{ id: 'a1', name: 'HP', initialValue: 0, baseGrowth: 0 }],
      systemBindings: [],
    }
    expect(validateRoleConfig(config).valid).toBe(true)
  })
})
