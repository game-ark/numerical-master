<template>
  <AppLayout />
</template>

<script setup lang="ts">
import { useRoleConfigStore } from './store/roleConfig'
import { useTemplateStore } from './store/template'
import { useSystemTemplateStore } from './store/systemTemplate'
import { useAttributeLibraryStore } from './store/attributeLibrary'
import { defaultConfig, defaultSystemTemplates } from './data/defaultConfig'
import AppLayout from './components/AppLayout.vue'

const roleConfigStore = useRoleConfigStore()
const templateStore = useTemplateStore()
const systemTemplateStore = useSystemTemplateStore()
const attributeLibraryStore = useAttributeLibraryStore()

attributeLibraryStore.loadFromStorage()
systemTemplateStore.loadFromStorage()
if (systemTemplateStore.templates.length === 0) {
  systemTemplateStore.templates = JSON.parse(JSON.stringify(defaultSystemTemplates))
  systemTemplateStore.saveToStorage()
}

roleConfigStore.loadConfig(JSON.parse(JSON.stringify(defaultConfig)))
templateStore.loadFromStorage()
</script>
