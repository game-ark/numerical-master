import { ref } from 'vue'
import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'

export interface LibraryAttribute {
  id: string
  name: string
  key: string
  description: string
}

const STORAGE_KEY = 'attribute-library'

export const useAttributeLibraryStore = defineStore('attributeLibrary', () => {
  const attributes = ref<LibraryAttribute[]>([])

  function loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          attributes.value = parsed.map((a: any) => ({
            id: a.id,
            name: a.name ?? '',
            key: a.key ?? '',
            description: a.description ?? ''
          }))
        }
      }
    } catch {
      attributes.value = []
    }
  }

  function saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attributes.value))
  }

  function addAttribute(name: string): string {
    const id = nanoid()
    attributes.value.push({ id, name, key: '', description: '' })
    saveToStorage()
    return id
  }

  function updateAttribute(id: string, partial: Partial<Omit<LibraryAttribute, 'id'>>): void {
    const attr = attributes.value.find(a => a.id === id)
    if (attr) {
      Object.assign(attr, partial)
      saveToStorage()
    }
  }

  function renameAttribute(id: string, name: string): void {
    const attr = attributes.value.find(a => a.id === id)
    if (attr) {
      attr.name = name
      saveToStorage()
    }
  }

  function removeAttribute(id: string): void {
    attributes.value = attributes.value.filter(a => a.id !== id)
    saveToStorage()
  }

  function getAttributeName(id: string): string {
    return attributes.value.find(a => a.id === id)?.name ?? '(未知属性)'
  }

  return {
    attributes,
    loadFromStorage,
    saveToStorage,
    addAttribute,
    updateAttribute,
    renameAttribute,
    removeAttribute,
    getAttributeName
  }
})
