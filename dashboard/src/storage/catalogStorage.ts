import type { ToolRecord } from '../types'

const KEY = 'dcc-tool-catalog-v1'

export function loadCatalog(): ToolRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ToolRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCatalog(tools: ToolRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(tools))
}

export function exportCatalogJson(tools: ToolRecord[]): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tools }, null, 2)
}

export function importCatalogJson(text: string): ToolRecord[] {
  const data = JSON.parse(text) as { tools?: ToolRecord[] }
  if (!data.tools || !Array.isArray(data.tools)) {
    throw new Error('JSON inválido: falta array "tools"')
  }
  return data.tools
}
