import type { RoleConfig } from '../types/index'
import { validateRoleConfig } from './validation'

/**
 * 将角色配置导出为格式化的 JSON 字符串（2 空格缩进）
 */
export function exportConfigToJSON(config: RoleConfig): string {
  return JSON.stringify(config, null, 2)
}

/**
 * 从 JSON 字符串导入角色配置，包含解析和验证
 */
export function importConfigFromJSON(json: string): { success: boolean; data?: RoleConfig; error?: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { success: false, error: 'JSON 格式错误' }
  }

  const result = validateRoleConfig(parsed)
  if (!result.valid) {
    return { success: false, error: result.errors.join('; ') }
  }

  return { success: true, data: parsed as RoleConfig }
}

/**
 * 触发浏览器下载 JSON 文件
 */
export function downloadJSON(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 读取文件内容为文本字符串
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
