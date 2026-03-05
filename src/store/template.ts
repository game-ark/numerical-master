import { ref } from 'vue'
import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import type { AttributeTemplate, RoleAttribute, RoleSystemBinding } from '../types/index'

const STORAGE_KEY = 'role-growth-templates'

export const useTemplateStore = defineStore('template', () => {
  const templates = ref<AttributeTemplate[]>([])

  function loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          templates.value = parsed.map((t: any) => ({
            ...t,
            systemBindings: Array.isArray(t.systemBindings) ? t.systemBindings : []
          }))
        } else {
          console.warn('role-growth-templates data is not an array, initializing as empty')
          templates.value = []
        }
      }
    } catch (e) {
      console.warn('Failed to parse role-growth-templates from localStorage:', e)
      templates.value = []
    }
  }

  function saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates.value))
  }

  function saveTemplate(
    name: string,
    roleName: string,
    growthFactor: number,
    attributes: RoleAttribute[],
    systemBindings: RoleSystemBinding[]
  ): { success: boolean; isDuplicate?: boolean; error?: string } {
    if (!name.trim()) {
      return { success: false, error: '模板名称不能为空' }
    }
    if (isNameDuplicate(name)) {
      return { success: false, isDuplicate: true }
    }
    const clonedAttributes: RoleAttribute[] = JSON.parse(JSON.stringify(attributes))
    const clonedBindings: RoleSystemBinding[] = JSON.parse(JSON.stringify(systemBindings))
    templates.value.push({
      id: nanoid(),
      name,
      roleName,
      growthFactor,
      attributes: clonedAttributes,
      systemBindings: clonedBindings
    })
    saveToStorage()
    return { success: true }
  }

  function applyTemplate(templateId: string): { roleName: string; growthFactor: number; attributes: RoleAttribute[]; systemBindings: RoleSystemBinding[] } | null {
    const template = templates.value.find((t) => t.id === templateId)
    if (!template) {
      return null
    }
    return {
      roleName: template.roleName,
      growthFactor: template.growthFactor,
      attributes: JSON.parse(JSON.stringify(template.attributes)),
      systemBindings: JSON.parse(JSON.stringify(template.systemBindings ?? []))
    }
  }

  function removeTemplate(templateId: string): void {
    templates.value = templates.value.filter((t) => t.id !== templateId)
    saveToStorage()
  }

  function renameTemplate(
    templateId: string,
    newName: string
  ): { success: boolean; error?: string } {
    if (!newName.trim()) {
      return { success: false, error: '模板名称不能为空' }
    }
    const exists = templates.value.some(
      (t) => t.id !== templateId && t.name === newName
    )
    if (exists) {
      return { success: false, error: '模板名称已存在' }
    }
    const template = templates.value.find((t) => t.id === templateId)
    if (template) {
      template.name = newName
      saveToStorage()
    }
    return { success: true }
  }

  function isNameDuplicate(name: string): boolean {
    return templates.value.some((t) => t.name === name)
  }

  return {
    templates,
    loadFromStorage,
    saveToStorage,
    saveTemplate,
    applyTemplate,
    removeTemplate,
    renameTemplate,
    isNameDuplicate
  }
})
