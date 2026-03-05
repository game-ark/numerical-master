import { ref } from 'vue'
import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import type { SystemTemplate, Resource, Effect, ComboEffect } from '../types/index'

const STORAGE_KEY = 'role-growth-system-templates'

export const useSystemTemplateStore = defineStore('systemTemplate', () => {
  const templates = ref<SystemTemplate[]>([])

  function loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          // Migrate old templates that lack comboEffects
          templates.value = parsed.map((t: any) => ({
            ...t,
            comboEffects: Array.isArray(t.comboEffects) ? t.comboEffects : []
          }))
        } else {
          templates.value = []
        }
      }
    } catch {
      templates.value = []
    }
  }

  function saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates.value))
  }

  function getTemplate(id: string): SystemTemplate | undefined {
    return templates.value.find(t => t.id === id)
  }

  function addTemplate(): string {
    const id = nanoid()
    templates.value.push({ id, name: '新系统', color: '#409EFF', resources: [], comboEffects: [] })
    saveToStorage()
    return id
  }

  function updateTemplate(id: string, partial: Partial<SystemTemplate>): void {
    const t = templates.value.find(t => t.id === id)
    if (t) Object.assign(t, partial)
    saveToStorage()
  }

  function removeTemplate(id: string): void {
    templates.value = templates.value.filter(t => t.id !== id)
    saveToStorage()
  }

  function addResource(templateId: string): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t) {
      t.resources.push({ id: nanoid(), name: '新资源', effects: [] })
      saveToStorage()
    }
  }

  function updateResource(templateId: string, resourceIndex: number, partial: Partial<Resource>): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t) {
      t.resources[resourceIndex] = { ...t.resources[resourceIndex], ...partial }
      saveToStorage()
    }
  }

  function removeResource(templateId: string, resourceIndex: number): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t) {
      t.resources.splice(resourceIndex, 1)
      saveToStorage()
    }
  }

  function addEffect(templateId: string, resourceIndex: number): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t) {
      t.resources[resourceIndex].effects.push({ id: nanoid(), targetAttributeId: '', type: 'fixed', value: 0 })
      saveToStorage()
    }
  }

  function updateEffect(templateId: string, resourceIndex: number, effectIndex: number, partial: Partial<Effect>): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t) {
      t.resources[resourceIndex].effects[effectIndex] = {
        ...t.resources[resourceIndex].effects[effectIndex],
        ...partial
      }
      saveToStorage()
    }
  }

  function removeEffect(templateId: string, resourceIndex: number, effectIndex: number): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t) {
      t.resources[resourceIndex].effects.splice(effectIndex, 1)
      saveToStorage()
    }
  }

  // === Combo Effect CRUD ===
  function addComboEffect(templateId: string): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t) {
      if (!t.comboEffects) t.comboEffects = []
      t.comboEffects.push({ id: nanoid(), name: '新组合', requiredResourceIds: [], effects: [] })
      saveToStorage()
    }
  }

  function updateComboEffect(templateId: string, comboIndex: number, partial: Partial<ComboEffect>): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t && t.comboEffects?.[comboIndex]) {
      t.comboEffects[comboIndex] = { ...t.comboEffects[comboIndex], ...partial }
      saveToStorage()
    }
  }

  function removeComboEffect(templateId: string, comboIndex: number): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t && t.comboEffects) {
      t.comboEffects.splice(comboIndex, 1)
      saveToStorage()
    }
  }

  function toggleComboResource(templateId: string, comboIndex: number, resourceId: string): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t && t.comboEffects?.[comboIndex]) {
      const combo = t.comboEffects[comboIndex]
      const idx = combo.requiredResourceIds.indexOf(resourceId)
      if (idx >= 0) combo.requiredResourceIds.splice(idx, 1)
      else combo.requiredResourceIds.push(resourceId)
      saveToStorage()
    }
  }

  function setComboRequiredResources(templateId: string, comboIndex: number, resourceIds: string[]): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t && t.comboEffects?.[comboIndex]) {
      t.comboEffects[comboIndex].requiredResourceIds = resourceIds
      saveToStorage()
    }
  }
  function setComboRequiredResources(templateId: string, comboIndex: number, resourceIds: string[]): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t && t.comboEffects?.[comboIndex]) {
      t.comboEffects[comboIndex].requiredResourceIds = resourceIds
      saveToStorage()
    }
  }

  function addComboEffectItem(templateId: string, comboIndex: number): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t && t.comboEffects?.[comboIndex]) {
      t.comboEffects[comboIndex].effects.push({ id: nanoid(), targetAttributeId: '', type: 'fixed', value: 0 })
      saveToStorage()
    }
  }

  function updateComboEffectItem(templateId: string, comboIndex: number, effectIndex: number, partial: Partial<Effect>): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t && t.comboEffects?.[comboIndex]) {
      t.comboEffects[comboIndex].effects[effectIndex] = {
        ...t.comboEffects[comboIndex].effects[effectIndex],
        ...partial
      }
      saveToStorage()
    }
  }

  function removeComboEffectItem(templateId: string, comboIndex: number, effectIndex: number): void {
    const t = templates.value.find(t => t.id === templateId)
    if (t && t.comboEffects?.[comboIndex]) {
      t.comboEffects[comboIndex].effects.splice(effectIndex, 1)
      saveToStorage()
    }
  }

  return {
    templates,
    loadFromStorage,
    saveToStorage,
    getTemplate,
    addTemplate,
    updateTemplate,
    removeTemplate,
    addResource,
    updateResource,
    removeResource,
    addEffect,
    updateEffect,
    removeEffect,
    addComboEffect,
    updateComboEffect,
    removeComboEffect,
    toggleComboResource,
    setComboRequiredResources,
    addComboEffectItem,
    updateComboEffectItem,
    removeComboEffectItem
  }
})
