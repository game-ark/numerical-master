import type { RoleConfig, SystemTemplate } from '../types/index'

export const defaultSystemTemplates: SystemTemplate[] = []

export const defaultConfig: RoleConfig = {
  name: '示例角色',
  growthFactor: 1.0,
  attributes: [],
  systemBindings: []
}
