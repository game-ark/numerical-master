import { describe, it, expect } from 'vitest'
import { exportConfigToJSON, importConfigFromJSON } from '../persistence'
import type { RoleConfig } from '../../types/index'

const validConfig: RoleConfig = {
  name: '测试角色',
  growthFactor: 1.2,
  attributes: [
    { id: 'attr1', name: 'HP', initialValue: 100, baseGrowth: 10 },
    { id: 'attr2', name: 'ATK', initialValue: 50, baseGrowth: 5 },
  ],
  systemBindings: [
    { systemTemplateId: 'sys1', activeResourceIds: ['res1'] },
  ],
}

describe('exportConfigToJSON', () => {
  it('returns a 2-space indented JSON string', () => {
    const json = exportConfigToJSON(validConfig)
    expect(json).toBe(JSON.stringify(validConfig, null, 2))
  })

  it('produces valid JSON that can be parsed back', () => {
    const json = exportConfigToJSON(validConfig)
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe(validConfig.name)
    expect(parsed.attributes).toHaveLength(2)
    expect(parsed.systemBindings).toHaveLength(1)
  })
})

describe('importConfigFromJSON', () => {
  it('successfully imports valid JSON config', () => {
    const json = exportConfigToJSON(validConfig)
    const result = importConfigFromJSON(json)
    expect(result.success).toBe(true)
    expect(result.data!.name).toBe('测试角色')
  })

  it('returns error for invalid JSON syntax', () => {
    const result = importConfigFromJSON('{invalid json}')
    expect(result.success).toBe(false)
    expect(result.error).toBe('JSON 格式错误')
  })

  it('returns error for empty string', () => {
    expect(importConfigFromJSON('').success).toBe(false)
  })

  it('returns validation errors for missing fields', () => {
    const result = importConfigFromJSON('{"name": "test"}')
    expect(result.success).toBe(false)
  })

  it('round-trips a valid config correctly', () => {
    const json = exportConfigToJSON(validConfig)
    const result = importConfigFromJSON(json)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validConfig)
  })
})
