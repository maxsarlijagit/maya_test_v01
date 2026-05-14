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

function useSystemStatus() {
  const [uptime, setUptime] = useState(0)
  const [cpu, setCpu] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((u) => u + 1)
      setCpu(Math.floor(Math.random() * 15) + 5)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return { uptime, cpu }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('catalog')
  const [tools, setTools] = useState<ToolRecord[]>(() => loadCatalog())
  const [filter, setFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState<Platform | ''>('')
  const { uptime, cpu } = useSystemStatus()
  const [isAlertMode, setIsAlertMode] = useState(false)

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
      setAiError('ERROR: API KEY MISSING. ACCESS DENIED.')
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
        'Respondes siempre en español, Markdown claro, estilo terminal futurista.'
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
    a.download = `mission-data-${new Date().toISOString().slice(0, 10)}.json`
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
    <div className="min-h-screen relative">
      <div className="scanline"></div>

      <header className="border-b border-[rgba(0,255,242,0.3)] bg-[rgba(10,12,16,0.9)] sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border-2 border-[rgb(var(--accent))] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[rgb(var(--accent))] opacity-10 animate-pulse"></div>
                <span className="text-2xl font-bold">M</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--accent))] opacity-70">
                // SYSTEM_CONTROL_INTERFACE_V2.0.27
              </p>
              <h1 className="text-2xl font-black tracking-tighter text-white glitch-text">
                HUD_CENTRAL
              </h1>
            </div>
          </div>

          <div className="flex gap-8 text-[10px] font-mono text-[rgb(var(--accent))]">
            <button
              onClick={() => {
                setIsAlertMode(!isAlertMode);
                document.documentElement.style.setProperty('--accent', isAlertMode ? '0 255 242' : '255 60 60');
                document.documentElement.style.setProperty('--border', isAlertMode ? '0 255 242' : '255 60 60');
              }}
              className="px-3 py-1 border border-[rgb(var(--accent))] text-[9px] hover:bg-[rgb(var(--accent))] hover:text-black transition-colors"
            >
              {isAlertMode ? '[ MODO_NORMAL ]' : '[ MODO_ALERTA ]'}
            </button>
            <div className="flex flex-col border-l border-[rgba(0,255,242,0.3)] pl-4">
                <span className="opacity-50">TIEMPO_ACTIVO</span>
                <span className="text-sm font-bold">{String(Math.floor(uptime/60)).padStart(2,'0')}:{String(uptime%60).padStart(2,'0')}:00</span>
            </div>
            <div className="flex flex-col border-l border-[rgba(0,255,242,0.3)] pl-4">
                <span className="opacity-50">CARGA_SIS</span>
                <span className="text-sm font-bold">{cpu}%</span>
            </div>
            <div className="flex flex-col border-l border-[rgba(0,255,242,0.3)] pl-4">
                <span className="opacity-50">UBICACIÓN</span>
                <span className="text-sm font-bold">COLONIA_MARTE_01</span>
            </div>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-4 px-6 pb-4">
          {(
            [
              ['catalog', 'MANIFIESTO'],
              ['create', 'NUEVO_REGISTRO'],
              ['docs', 'ARCHIVOS'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-1 text-xs font-bold transition-all relative overflow-hidden border ${
                tab === id
                  ? 'bg-[rgb(var(--accent))] text-black border-[rgb(var(--accent))]'
                  : 'text-[rgb(var(--accent))] border-[rgba(0,255,242,0.3)] hover:bg-[rgba(0,255,242,0.1)]'
              }`}
            >
              [{label}]
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === 'catalog' && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-end gap-4 p-4 hud-panel">
              <label className="flex min-w-[200px] flex-1 flex-col gap-2">
                <span className="text-[10px] font-bold text-[rgb(var(--accent))] opacity-70">CONSULTA_BÚSQUEDA</span>
                <input
                  className="px-3 py-2 text-sm font-mono"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="FILTRAR POR NOMBRE, NOTAS, API..."
                />
              </label>
              <label className="flex w-48 flex-col gap-2">
                <span className="text-[10px] font-bold text-[rgb(var(--accent))] opacity-70">PLATAFORMA_OBJETIVO</span>
                <select
                  className="px-3 py-2 text-sm font-mono"
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter((e.target.value || '') as Platform | '')}
                >
                  <option value="">TODOS_LOS_SISTEMAS</option>
                  {platforms.map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={downloadExport}
                  className="border border-[rgba(0,255,242,0.5)] px-4 py-2 text-xs font-bold text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))] hover:text-black"
                >
                  EXPORTAR_DATOS
                </button>
                <label className="cursor-pointer border border-[rgba(0,255,242,0.5)] px-4 py-2 text-xs font-bold text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))] hover:text-black">
                  IMPORTAR_DATOS
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => onImportFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.length === 0 && (
                    <div className="col-span-full p-12 text-center border border-dashed border-[rgba(0,255,242,0.3)]">
                      <p className="text-[rgb(var(--accent))] opacity-50 font-mono italic">
                        NO_SE_ENCONTRARON_REGISTROS_EN_EL_MANIFIESTO
                      </p>
                    </div>
                  )}
                  {filtered.map((t) => (
                    <div key={t.id} className="hud-card group">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-mono text-[rgb(var(--accent))] opacity-50">#{t.id.slice(0,8)}</span>
                            <span className="px-2 py-0.5 bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))] text-[9px] font-bold">
                                {PLATFORM_LABELS[t.platform].toUpperCase()}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold mb-2 group-hover:text-[rgb(var(--accent))] transition-colors">{t.name}</h3>
                        <p className="text-xs text-[rgb(var(--muted))] line-clamp-2 mb-4 h-8">
                            {t.notes || "SIN_DESCRIPCIÓN_DISPONIBLE"}
                        </p>

                        <div className="space-y-2 border-t border-[rgba(0,255,242,0.1)] pt-4">
                            <div className="flex justify-between text-[10px]">
                                <span className="opacity-50">SUPERFICIE_API</span>
                                <span className="font-bold">{t.technical.apiSurface || "N/A"}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="opacity-50">ETAPA</span>
                                <span className="font-bold">{t.production.pipelineStage || "N/A"}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                className="text-[rgb(var(--danger))] text-[9px] font-bold hover:underline"
                                onClick={() => removeTool(t.id)}
                            >
                                [ TERMINAR_REGISTRO ]
                            </button>
                        </div>
                    </div>
                  ))}
            </div>
          </section>
        )}

        {tab === 'create' && (
          <section className="space-y-8 max-w-4xl mx-auto">
            <form onSubmit={onSubmitCreate} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2 p-6 hud-panel">
                <label className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[rgb(var(--accent))] opacity-70">NOMBRE_ENTRADA *</span>
                  <input
                    required
                    className="px-3 py-2 text-sm font-mono"
                    value={draft.name ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="EJ. UV_SCANNER_v1"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[rgb(var(--accent))] opacity-70">SISTEMA_PLATAFORMA *</span>
                  <select
                    className="px-3 py-2 text-sm font-mono"
                    value={draft.platform}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, platform: e.target.value as Platform }))
                    }
                  >
                    {platforms.map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
                {draft.platform === 'maya' && (
                  <label className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[rgb(var(--accent))] opacity-70">VERSIÓN_RUNTIME_MAYA</span>
                    <select
                      className="px-3 py-2 text-sm font-mono"
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

              <div className="p-6 hud-panel">
                <h2 className="text-sm font-bold text-[rgb(var(--accent))] mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-[rgb(var(--accent))]"></div>
                    ESPECIFICACIONES_TÉCNICAS
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="INTERFAZ_API"
                    value={draft.technical?.apiSurface ?? ''}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        technical: { ...DEFAULT_TECHNICAL(), ...d.technical, apiSurface: v },
                      }))
                    }
                  />
                  <Field
                    label="VECTORES_ENTRADA"
                    value={draft.technical?.entryPoints ?? ''}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        technical: { ...DEFAULT_TECHNICAL(), ...d.technical, entryPoints: v },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="p-6 hud-panel border-[rgba(0,255,242,0.1)]">
                <h2 className="text-[10px] font-bold text-[rgb(var(--accent))] mb-4 opacity-70">MÓDULO_DISEÑO_COGNITIVO (IA)</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="md:col-span-2 flex flex-col gap-2">
                    <span className="text-[10px] font-bold opacity-50">PROMPT_INTENCIÓN</span>
                    <textarea
                      className="min-h-[80px] px-3 py-2 text-sm font-mono"
                      value={userIntent}
                      onChange={(e) => setUserIntent(e.target.value)}
                      placeholder="DESCRIBA LOS OBJETIVOS DE LA MISIÓN..."
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold opacity-50">URL_BASE</span>
                    <input
                      className="px-3 py-2 text-sm font-mono"
                      value={aiBaseUrl}
                      onChange={(e) => setAiBaseUrl(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold opacity-50">MODELO_NEURAL</span>
                    <input
                      className="px-3 py-2 text-sm font-mono"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold opacity-50">TOKEN_ACCESO</span>
                    <input
                      type="password"
                      autoComplete="off"
                      className="px-3 py-2 text-sm font-mono"
                      value={aiKey}
                      onChange={(e) => setAiKey(e.target.value)}
                      placeholder="SK-XXXX..."
                    />
                  </label>
                </div>
                {aiError && (
                  <p className="mt-3 text-[10px] font-bold text-[rgb(var(--danger))] animate-pulse">{aiError}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={runAi}
                    disabled={aiLoading}
                    className="bg-[rgb(var(--accent))] text-black px-6 py-2 text-xs font-black shadow-[0_0_15px_rgba(var(--accent),0.4)] hover:shadow-[0_0_25px_rgba(var(--accent),0.6)] disabled:opacity-50"
                  >
                    {aiLoading ? 'COMUNICANDO...' : 'EJECUTAR_DISEÑO_IA'}
                  </button>
                </div>
                {draft.aiGeneratedSpec && (
                  <div className="mt-6 border-t border-[rgba(0,255,242,0.2)] pt-4">
                    <p className="text-[10px] font-bold text-[rgb(var(--accent))] mb-2">LOG_SALIDA_NEURAL:</p>
                    <pre className={`mt-2 max-h-80 overflow-auto ai-terminal p-4 text-[10px] font-mono leading-relaxed text-[rgb(var(--accent))] ${aiLoading ? 'ai-processing' : ''}`}>
                      {draft.aiGeneratedSpec}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-white text-black px-8 py-3 text-sm font-black hover:bg-[rgb(var(--accent))] transition-colors"
                >
                  GUARDAR_EN_MANIFIESTO
                </button>
                <button
                  type="button"
                  onClick={() => setTab('catalog')}
                  className="border border-[rgba(255,255,255,0.3)] px-8 py-3 text-sm font-bold text-white hover:border-white"
                >
                  ABORTAR
                </button>
              </div>
            </form>
          </section>
        )}

        {tab === 'docs' && (
          <section className="hud-panel p-8">
            <h2 className="text-xl font-black mb-6">ARCHIVOS_HISTÓRICOS</h2>
            <div className="grid gap-6 text-sm">
                <div className="border-l-2 border-[rgb(var(--accent))] pl-4">
                    <h4 className="font-bold mb-1 opacity-50">UBICACIÓN:</h4>
                    <code className="text-xs">docs/api-references/</code>
                </div>
                <ul className="space-y-4 font-mono text-xs">
                    <li className="flex items-center gap-2">
                        <span className="text-[rgb(var(--accent))]">{'>'}</span>
                        <span>maya.md — ENTORNO_DCC_MAYA</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-[rgb(var(--accent))]">{'>'}</span>
                        <span>blender.md — ENTORNO_DCC_BLENDER</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-[rgb(var(--accent))]">{'>'}</span>
                        <span>unreal-engine.md — ENTORNO_DCC_UNREAL</span>
                    </li>
                </ul>
            </div>
          </section>
        )}
      </main>

      <footer className="mx-auto mt-12 max-w-6xl border-t border-[rgba(0,255,242,0.1)] px-6 py-8 text-center">
        <p className="text-[10px] font-mono text-[rgb(var(--accent))] opacity-30">
          PERSISTENCIA_LOCAL_HABILITADA // ID_TRANSMISIÓN_ENCRIPTADA: {uptime}-{cpu}-XYZ
        </p>
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
      <span className="text-[10px] font-bold text-[rgb(var(--accent))] opacity-70">{props.label}</span>
      <input
        className="px-3 py-2 text-sm font-mono"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  )
}
