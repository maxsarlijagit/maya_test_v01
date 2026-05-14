import { PLATFORM_AI_CONTEXT } from '../context/platformContexts'
import type { Platform, ProductionBlock, TechnicalBlock } from '../types'
import { PLATFORM_LABELS } from '../types'

export interface AiSettings {
  baseUrl: string
  apiKey: string
  model: string
}

const DEFAULT_BASE = 'https://api.openai.com/v1'

export function buildToolDesignPrompt(params: {
  toolName: string
  platform: Platform
  mayaVersion?: string
  userIntent: string
  technical: TechnicalBlock
  production: ProductionBlock
}): string {
  const { toolName, platform, mayaVersion, userIntent, technical, production } = params
  const platLabel = PLATFORM_LABELS[platform]
  const ctx = PLATFORM_AI_CONTEXT[platform]
  const mayaLine =
    platform === 'maya' && mayaVersion
      ? `Versión Maya objetivo: ${mayaVersion}.`
      : ''

  return `Eres un arquitecto de herramientas DCC. Propón un diseño técnico y de producción conciso.

Plataforma: ${platLabel}
${mayaLine}
Contexto API: ${ctx}

Nombre provisional: ${toolName}

Intención / feature: ${userIntent}

Bloque técnico (rellenado por el usuario, puede estar vacío):
- Superficie API: ${technical.apiSurface || '(vacío)'}
- Entry points: ${technical.entryPoints || '(vacío)'}
- Dependencias: ${technical.dependencies || '(vacío)'}
- Estrategia de tests: ${technical.testStrategy || '(vacío)'}

Bloque producción:
- Owner: ${production.owner || '(vacío)'}
- Etapa pipeline: ${production.pipelineStage || '(vacío)'}
- QA: ${production.qaNotes || '(vacío)'}
- Canal release: ${production.releaseChannel || '(vacío)'}

Responde en Markdown con secciones:
1. Resumen
2. Diseño técnico (APIs, módulos, límites de versión)
3. Producción (QA, rollout, riesgos)
4. Próximos pasos (checklist)
`.trim()
}

export async function callChatCompletions(
  settings: AiSettings,
  userPrompt: string,
  systemPrompt: string
): Promise<string> {
  const base = settings.baseUrl.trim() || DEFAULT_BASE
  const url = `${base.replace(/\/$/, '')}/chat/completions`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`API ${res.status}: ${errText.slice(0, 500)}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Respuesta vacía del modelo')
  return text
}
