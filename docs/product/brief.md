# Buildev: Brief de producto

## Estado actual verificado

Buildev es una aplicacion web construida con Next.js, React, TypeScript y Zustand orientada a un builder visual de interfaces. El flujo principal actual carga un dashboard simple y, cuando existe un proyecto activo en memoria, abre un editor con tres modos: `design`, `code` y `preview`.

## Capacidades verificadas en el repositorio

### 1. Editor / canvas

Existe un editor visual funcional base:

- `app/editor/EditorView.tsx` compone el editor principal.
- `app/editor/Canvas.tsx` implementa canvas con pan, zoom, seleccion, drag de elementos y edicion inline de texto.
- `lib/store.ts` mantiene proyectos, paginas, elementos, breakpoint activo, zoom y seleccion.
- `lib/types.ts` define un modelo jerarquico `SiteElement` con hijos y overrides responsivos.

Conclusión: **si existe un editor/canvas verificado**, con capacidad real de manipular nodos en memoria.

### 2. Chat IA

Existe una experiencia de chat IA enfocada en generacion de componentes:

- `app/editor/panels/AIAssistant.tsx` muestra mensajes, prompt y quick actions.
- `lib/aiService.ts` llama a `/api/generate-component`.
- `app/api/generate-component/route.ts` usa Anthropic via AI SDK para generar especificaciones estructuradas.

Tambien hay una segunda implementacion parcial:

- `app/editor/AiSidebar.tsx`
- `app/editor/panels/AIAssistant_new.tsx`

Conclusión: **si existe chat IA verificado**, pero hoy esta fragmentado en varias superficies y no hay una unica experiencia consolidada.

### 3. Exportacion a codigo

Existe exportacion/generacion a codigo en estado MVP:

- `lib/codeGenerator.ts` genera HTML y JSX/Next.js desde `Page` y `SiteElement`.
- `app/editor/CodePreview.tsx` renderiza el codigo generado en modo lectura/copia.
- `TopNavBar.tsx` permite descargar un ZIP basico con `project.json`, `README.md`, `index.html` y `styles.css`.

Conclusión: **si existe exportacion a codigo verificada**, pero es parcial y no representa aun un export fiel de proyecto productivo.

### 4. Screenshot / image parsing

Existe pipeline de screenshot parsing:

- `app/editor/ReverseUiModal.tsx` y `app/editor/reverse-ui/ReverseUiView.tsx` reciben imagen.
- `app/api/reverse-ui/route.ts` envia la imagen a `analyzeScreenshot`.
- `lib/ai-service.ts` abstrae el analisis y tiene fallback mock.
- `lib/ai/google-provider.ts` y `lib/ai/groq-provider.ts` implementan vision providers para reconstruir `SiteElement[]`.

Conclusión: **si existe screenshot/image parsing verificado**, pero el flujo no esta integrado de forma estable con la store actual.

## Lo que no esta verificado como listo para produccion

- Persistencia real de proyectos en la UI. Existe `lib/db/index.ts`, pero no esta conectada al flujo principal verificado.
- Monaco Editor real. El README lo menciona, pero no se encontro integracion real de Monaco en el codigo inspeccionado.
- Un modelo consistente entre editor base y paneles `*_PRO`.
- Un exportador de proyecto ejecutable y completo.

## Problema de producto actual

El repositorio ya contiene las piezas nucleares del producto, pero no opera como una plataforma consistente. Hay una base util de editor visual y pipelines de IA, aunque el contrato de datos compartido entre store, paneles avanzados, reverse UI y exportacion esta roto o incompleto.

## Oportunidad

La oportunidad inmediata no es sumar features, sino consolidar:

1. una sola arquitectura de editor,
2. un scene graph estable,
3. un pipeline de IA unificado,
4. un camino claro desde canvas a export.

## Criterio para pasar a Fase 1

Fase 1 deberia enfocarse en estabilizacion del nucleo:

- alinear store, tipos y paneles activos,
- cerrar errores de TypeScript,
- definir el contrato oficial del scene graph,
- unificar las dos capas de IA (`aiService.ts` y `ai-service.ts`),
- dejar un flujo minimo confiable de editor -> preview -> export.
