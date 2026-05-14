export type Platform =
  | 'maya'
  | 'blender'
  | 'substance_painter'
  | '3ds_max'
  | 'unreal'

export const PLATFORM_LABELS: Record<Platform, string> = {
  maya: 'Autodesk Maya',
  blender: 'Blender',
  substance_painter: 'Substance 3D Painter',
  '3ds_max': 'Autodesk 3ds Max',
  unreal: 'Unreal Engine',
}

/** Versiones Maya frecuentes; ajusta según catálogo de estudio */
export const MAYA_VERSIONS = [
  '2022',
  '2023',
  '2024',
  '2025',
  '2026',
  '2027',
] as const

export interface TechnicalBlock {
  apiSurface: string
  entryPoints: string
  dependencies: string
  testStrategy: string
}

export interface ProductionBlock {
  owner: string
  pipelineStage: string
  qaNotes: string
  releaseChannel: string
}

export interface ToolRecord {
  id: string
  name: string
  platform: Platform
  /** Solo cuando platform === maya */
  mayaVersion?: string
  technical: TechnicalBlock
  production: ProductionBlock
  aiGeneratedSpec?: string
  notes: string
  createdAt: string
  updatedAt: string
}

export const DEFAULT_TECHNICAL = (): TechnicalBlock => ({
  apiSurface: '',
  entryPoints: '',
  dependencies: '',
  testStrategy: '',
})

export const DEFAULT_PRODUCTION = (): ProductionBlock => ({
  owner: '',
  pipelineStage: '',
  qaNotes: '',
  releaseChannel: '',
})
