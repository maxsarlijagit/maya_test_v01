import { useCallback, useEffect, useMemo, useState } from 'react'
import { callChatCompletions, buildToolDesignPrompt } from './lib/aiGenerate'
import { newId } from './lib/id'
import {
  exportCatalogJson,
  importCatalogJson,
  loadCatalog,
  saveCatalog,
} from './storage/catalogStorage'
import {
  DEFAULT_PRODUCTION,
  DEFAULT_TECHNICAL,
  type Platform,
  type ToolRecord,
  PLATFORM_LABELS,
  MAYA_VERSIONS,
} from './types'

type Tab = 'catalog' | 'create' | 'docs'

function useDarkMode() {
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  )

  useEffect(() => {
    const saved = localStorage.getItem('dcc-catalog-dark')
    if (saved === '1') {
      document.documentElement.classList.add('dark')
      setDark(true)
    } else if (saved === '0') {
      document.documentElement.classList.remove('dark')
      setDark(false)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
      setDark(true)
    }
  }, [])

  const toggle = () => {
    document.documentElement.classList.toggle('dark')
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
    localStorage.setItem('dcc-catalog-dark', isDark ? '1' : '0')
  }

  return { dark, toggle }
}

export default function App() {
  const { dark, toggle } = useDarkMode()
  const [tab, setTab] = useState<Tab>('catalog')
  const [tools, setTools] = useState<ToolRecord[]>(() => loadCatalog())
  const [filter, setFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState<Platform | ''>('')

  const [draft, setDraft] = useState<Partial<ToolRecord>>(() => ({
    name: '',
    platform: 'maya',
    mayaVersion: '2027',
    notes: '',
    technical: DEFAULT_TECHNICAL(),
    production: DEFAULT_PRODUCTION(),
  }))

  const [userIntent, setUserIntent] = useState('')
  const [aiBaseUrl, setAiBaseUrl] = useState('https://api.openai.com/v1')
  const [aiKey, setAiKey] = useState('')
  const [aiModel, setAiModel] = useState('gpt-4o-mini')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    saveCatalog(tools)
  }, [tools])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return tools.filter((t) => {
      if (platformFilter && t.platform !== platformFilter) return false
      if (!q) return true
      const blob = `${t.name} ${t.notes} ${PLATFORM_LABELS[t.platform]} ${t.technical.apiSurface}`.toLowerCase()
      return blob.includes(q)
    })
  }, [tools, filter, platformFilter])

  const upsertTool = useCallback((record: ToolRecord) => {
    setTools((prev) => {
      const i = prev.findIndex((p) => p.id === record.id)
      if (i === -1) return [...prev, record]
      const next = [...prev]
      next[i] = record
      return next
    })
  }, [])

  const removeTool = useCallback((id: string) => {
    setTools((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const onSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const name = (draft.name || '').trim()
    if (!name) return
    const now = new Date().toISOString()
    const id = newId()
    const record: ToolRecord = {
      id,
      name,
      platform: (draft.platform as Platform) || 'maya',
      mayaVersion: draft.platform === 'maya' ? draft.mayaVersion : undefined,
      notes: draft.notes || '',
      technical: { ...DEFAULT_TECHNICAL(), ...draft.technical },
      production: { ...DEFAULT_PRODUCTION(), ...draft.production },
      aiGeneratedSpec: draft.aiGeneratedSpec,
      createdAt: now,
      updatedAt: now,
    }
    upsertTool(record)
    setDraft({
      name: '',
      platform: record.platform,
      mayaVersion: record.mayaVersion,
      notes: '',
      technical: DEFAULT_TECHNICAL(),
      production: DEFAULT_PRODUCTION(),
      aiGeneratedSpec: undefined,
    })
    setUserIntent('')
    setTab('catalog')
  }

  const runAi = async () => {
    setAiError(null)
    const name = (draft.name || '').trim() || 'Nueva herramienta'
    const platform = (draft.platform as Platform) || 'maya'
    if (!aiKey.trim()) {
      setAiError('Indica una API key (solo en este navegador; no se guarda en el catálogo).')
      return
    }
    setAiLoading(true)
    try {
      const userPrompt = buildToolDesignPrompt({
        toolName: name,
        platform,
        mayaVersion: draft.mayaVersion || undefined,
        userIntent: userIntent || '(sin descripción)',
        technical: { ...DEFAULT_TECHNICAL(), ...draft.technical },
        production: { ...DEFAULT_PRODUCTION(), ...draft.production },
      })
      const text = await callChatCompletions(
        { baseUrl: aiBaseUrl, apiKey: aiKey.trim(), model: aiModel },
        userPrompt,
        'Respondes siempre en español, Markdown claro, sin rodeos.'
      )
      setDraft((d) => ({ ...d, aiGeneratedSpec: text }))
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err))
    } finally {
      setAiLoading(false)
    }
  }

  const downloadExport = () => {
    const blob = new Blob([exportCatalogJson(tools)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `dcc-tool-catalog-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const onImportFile = (f: File | null) => {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = importCatalogJson(String(reader.result))
        setTools(imported)
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error al importar')
      }
    }
    reader.readAsText(f)
  }

  const platforms = Object.entries(PLATFORM_LABELS) as [Platform, string][]

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-[rgb(var(--surface-elevated))] dark:border-zinc-700">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Pipeline / TD
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Catálogo de herramientas
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
              Registro técnico y de producción; creación orientada a Maya, Blender, Painter, 3ds Max y
              Unreal, con generación asistida por API compatible con OpenAI.
            </p>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            {dark ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-2 px-6 pb-4">
          {(
            [
              ['catalog', 'Catálogo'],
              ['create', 'Nueva herramienta'],
              ['docs', 'Referencias API (local)'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                tab === id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === 'catalog' && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex min-w-[200px] flex-1 flex-col gap-2">
                <span className="text-xs font-medium text-zinc-500">Buscar</span>
                <input
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Nombre, notas, API…"
                />
              </label>
              <label className="flex w-48 flex-col gap-2">
                <span className="text-xs font-medium text-zinc-500">Plataforma</span>
                <select
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter((e.target.value || '') as Platform | '')}
                >
                  <option value="">Todas</option>
                  {platforms.map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={downloadExport}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium dark:border-zinc-600 dark:bg-zinc-800"
                >
                  Exportar JSON
                </button>
                <label className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium dark:border-zinc-600 dark:bg-zinc-800">
                  Importar JSON
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => onImportFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <th className="p-3 font-medium">Nombre</th>
                    <th className="p-3 font-medium">Plataforma</th>
                    <th className="p-3 font-medium">Maya</th>
                    <th className="p-3 font-medium">API / entry</th>
                    <th className="p-3 font-medium">Producción</th>
                    <th className="p-3 font-medium w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td className="p-6 text-zinc-500" colSpan={6}>
                        No hay herramientas que coincidan. Usa «Nueva herramienta» para registrar la
                        primera.
                      </td>
                    </tr>
                  )}
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                    >
                      <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">{t.name}</td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-300">
                        {PLATFORM_LABELS[t.platform]}
                      </td>
                      <td className="p-3 text-zinc-500">
                        {t.platform === 'maya' ? t.mayaVersion ?? '—' : '—'}
                      </td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-400">
                        <div className="line-clamp-2 max-w-xs">
                          {t.technical.apiSurface || '—'}
                          {t.technical.entryPoints ? ` · ${t.technical.entryPoints}` : ''}
                        </div>
                      </td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-400">
                        <div className="line-clamp-2 max-w-xs">
                          {t.production.pipelineStage || '—'}
                          {t.production.owner ? ` · ${t.production.owner}` : ''}
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          className="text-rose-600 text-sm hover:underline dark:text-rose-400"
                          onClick={() => removeTool(t.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'create' && (
          <section className="space-y-8">
            <form onSubmit={onSubmitCreate} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-zinc-500">Nombre de la herramienta *</span>
                  <input
                    required
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    value={draft.name ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="ej. UV Path Optimizer"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-zinc-500">Plataforma *</span>
                  <select
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    value={draft.platform}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, platform: e.target.value as Platform }))
                    }
                  >
                    {platforms.map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                {draft.platform === 'maya' && (
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-zinc-500">Versión de Maya</span>
                    <select
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                      value={draft.mayaVersion ?? '2027'}
                      onChange={(e) => setDraft((d) => ({ ...d, mayaVersion: e.target.value }))}
                    >
                      {MAYA_VERSIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Bloque técnico
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Superficies API, puntos de entrada y pruebas (alineado al código y al TD).
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field
                    label="Superficie API (cmds, bpy, pymxs, unreal…)"
                    value={draft.technical?.apiSurface ?? ''}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        technical: { ...DEFAULT_TECHNICAL(), ...d.technical, apiSurface: v },
                      }))
                    }
                  />
                  <Field
                    label="Entry points"
                    value={draft.technical?.entryPoints ?? ''}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        technical: { ...DEFAULT_TECHNICAL(), ...d.technical, entryPoints: v },
                      }))
                    }
                  />
                  <Field
                    label="Dependencias"
                    value={draft.technical?.dependencies ?? ''}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        technical: { ...DEFAULT_TECHNICAL(), ...d.technical, dependencies: v },
                      }))
                    }
                  />
                  <Field
                    label="Estrategia de tests"
                    value={draft.technical?.testStrategy ?? ''}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        technical: { ...DEFAULT_TECHNICAL(), ...d.technical, testStrategy: v },
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Bloque producción
                </h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field
                    label="Owner / equipo"
                    value={draft.production?.owner ?? ''}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        production: { ...DEFAULT_PRODUCTION(), ...d.production, owner: v },
                      }))
                    }
                  />
                  <Field
                    label="Etapa de pipeline"
                    value={draft.production?.pipelineStage ?? ''}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        production: { ...DEFAULT_PRODUCTION(), ...d.production, pipelineStage: v },
                      }))
                    }
                  />
                  <Field
                    label="Notas QA"
                    value={draft.production?.qaNotes ?? ''}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        production: { ...DEFAULT_PRODUCTION(), ...d.production, qaNotes: v },
                      }))
                    }
                  />
                  <Field
                    label="Canal de release"
                    value={draft.production?.releaseChannel ?? ''}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        production: { ...DEFAULT_PRODUCTION(), ...d.production, releaseChannel: v },
                      }))
                    }
                  />
                </div>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-500">Notas libres</span>
                <textarea
                  className="min-h-[88px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                  value={draft.notes ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                />
              </label>

              <div className="rounded-xl border border-indigo-200 bg-[rgb(var(--accent-soft))] p-6 dark:border-indigo-900/50">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Generación con IA (API compatible OpenAI)
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  La clave no se almacena: solo se usa en esta sesión del navegador para la petición.
                  Puedes usar un proxy compatible (misma forma de <code className="text-xs">/v1/chat/completions</code>
                  ).
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-zinc-500">Base URL</span>
                    <input
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                      value={aiBaseUrl}
                      onChange={(e) => setAiBaseUrl(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-zinc-500">Modelo</span>
                    <input
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                    />
                  </label>
                  <label className="md:col-span-2 flex flex-col gap-2">
                    <span className="text-xs font-medium text-zinc-500">API key</span>
                    <input
                      type="password"
                      autoComplete="off"
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                      value={aiKey}
                      onChange={(e) => setAiKey(e.target.value)}
                      placeholder="sk-…"
                    />
                  </label>
                  <label className="md:col-span-2 flex flex-col gap-2">
                    <span className="text-xs font-medium text-zinc-500">
                      Intención / descripción para el diseño
                    </span>
                    <textarea
                      className="min-h-[80px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                      value={userIntent}
                      onChange={(e) => setUserIntent(e.target.value)}
                      placeholder="Qué debe hacer la herramienta, restricciones, integración con el resto del pipe…"
                    />
                  </label>
                </div>
                {aiError && (
                  <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{aiError}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={runAi}
                    disabled={aiLoading}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {aiLoading ? 'Generando…' : 'Generar diseño (Markdown)'}
                  </button>
                </div>
                {draft.aiGeneratedSpec && (
                  <div className="mt-6">
                    <p className="text-xs font-medium text-zinc-500">Salida (se guarda al registrar)</p>
                    <pre className="mt-2 max-h-80 overflow-auto rounded-lg border border-zinc-200 bg-white p-4 text-left text-xs leading-relaxed dark:border-zinc-600 dark:bg-zinc-950">
                      {draft.aiGeneratedSpec}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Guardar en catálogo
                </button>
                <button
                  type="button"
                  onClick={() => setTab('catalog')}
                  className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm dark:border-zinc-600"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}

        {tab === 'docs' && (
          <section className="max-w-none">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Documentación en el repositorio
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Ruta base: <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">docs/api-references/</code>.
              Abre los archivos en el IDE o enlázalos desde la wiki interna.
            </p>
            <ul className="mt-6 list-disc space-y-3 pl-6 text-sm text-zinc-700 dark:text-zinc-300">
              <li>
                <code className="text-xs">maya.md</code> — Maya Python / MEL / API por versión
              </li>
              <li>
                <code className="text-xs">blender.md</code> — bpy
              </li>
              <li>
                <code className="text-xs">substance-painter.md</code> — Painter Python
              </li>
              <li>
                <code className="text-xs">3ds-max.md</code> — pymxs / MAXScript
              </li>
              <li>
                <code className="text-xs">unreal-engine.md</code> — Python del editor UE
              </li>
            </ul>
            <p className="mt-8 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Esta app no sustituye la documentación oficial: usa los enlaces dentro de cada archivo para
              la versión exacta instalada en producción.
            </p>
          </section>
        )}
      </main>

      <footer className="mx-auto mt-12 max-w-6xl border-t border-zinc-200 px-6 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
        Datos del catálogo en <code>localStorage</code>; exporta JSON para backup o para versionar en git.
      </footer>
    </div>
  )
}

function Field(props: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium text-zinc-500">{props.label}</span>
      <input
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  )
}
