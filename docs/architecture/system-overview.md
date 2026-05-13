# System Overview

## Resumen

Buildev es hoy una aplicacion cliente pesada sobre Next.js App Router. La mayor parte del valor del producto vive en componentes client-side montados sobre una store global de Zustand. El backend actual se limita a rutas API para tareas de IA.

## Estructura verificada

### Frontend principal

- `app/page.tsx` redirige al dashboard.
- `app/dashboard.tsx` decide entre `ProjectGrid` y `EditorView` segun `currentProject`.
- `app/editor/EditorView.tsx` orquesta los modos `design`, `code` y `preview`.

### Nucleo de estado

- `lib/types.ts` define `Project`, `Page`, `SiteElement`, breakpoints y estado de editor.
- `lib/store.ts` implementa la store principal con CRUD basico de proyectos, paginas y elementos.

### Superficies del editor

- `Canvas.tsx` es el canvas base operativo.
- `CodePreview.tsx` es la vista de codigo generada.
- `PreviewMode.tsx` es la vista de preview visual.
- `LeftSidebar.tsx` usa paneles base (`Layers`, `Config`, `Assets`, `AI`).
- `RightSidebar.tsx` usa paneles `*_PRO`.

### Servicios de IA

- `app/api/generate-component/route.ts`: generacion estructurada de componentes con Anthropic.
- `app/api/generate-responsive/route.ts`: adaptacion responsive con Gemini.
- `app/api/reverse-ui/route.ts`: reverse UI desde screenshot.
- `lib/aiService.ts`: cliente de generacion de componentes.
- `lib/ai-service.ts`: refinamiento y screenshot analysis.
- `lib/ai/*`: abstraccion de providers.

### Exportacion

- `lib/codeGenerator.ts`: genera HTML y JSX.
- `CodePreview.tsx`: muestra y copia codigo.
- `TopNavBar.tsx`: descarga ZIP basico.

## Arquitectura real observada

### Patron dominante

La arquitectura actual es una mezcla de:

- editor visual stateful en cliente,
- scene graph jerarquico en memoria,
- API routes para IA,
- exportacion generada desde el estado de pagina.

### Fuente de verdad actual

La fuente de verdad del editor verificado es `useAppStore` + `Page.elements`.

### Fracturas de arquitectura detectadas

1. El editor activo mezcla piezas base con piezas `PRO`.
2. La store actual no satisface el contrato que consumen varios paneles `PRO`.
3. Existen dos capas de IA con responsabilidades solapadas:
   - `lib/aiService.ts`
   - `lib/ai-service.ts`
4. Existen componentes y flujos no conectados al shell principal:
   - `Canvas_PRO.tsx`
   - `AIAssistant_new.tsx`
   - `ReverseUiView.tsx`
5. El almacenamiento Dexie existe como modulo aislado, no como parte del flujo principal verificado.

## Matriz de capacidades verificadas

| Capacidad | Estado | Evidencia |
| --- | --- | --- |
| Editor/canvas | Parcialmente operativo | `Canvas.tsx`, `EditorView.tsx`, `store.ts` |
| Chat IA | Operativo pero fragmentado | `AIAssistant.tsx`, `aiService.ts`, `/api/generate-component` |
| Exportacion a codigo | MVP parcial | `codeGenerator.ts`, `CodePreview.tsx`, `TopNavBar.tsx` |
| Screenshot parsing | Implementado pero no estable | `ReverseUiModal.tsx`, `/api/reverse-ui`, `ai-service.ts`, providers |
| Persistencia | Parcial / no integrada | `lib/db/index.ts` sin integracion verificada en UI |

## Riesgos tecnicos de alto impacto

### 1. Contrato roto entre UI y store

`npx tsc --noEmit` falla porque varios componentes usan acciones o campos inexistentes en `AppState` y `Project`, por ejemplo `importElements`, `createInstance`, `updateProject`, `designSystem`, `description`.

### 2. Modelo de nodo insuficiente para paneles avanzados

Los paneles `PRO` esperan propiedades como `borderRadius`, `autoLayout`, constraints, states e interactions que no existen en `SiteElement`.

### 3. Dependencias/capa IA inconsistentes

Hay mezcla de proveedores, nombres de variables de entorno y adaptadores:

- `generate-component` usa Anthropic AI SDK.
- `generate-responsive` usa `GEMINI_API`.
- `ai/factory.ts` espera `GOOGLE_API_KEY` y `GROQ_API_KEY`.
- `groq-provider.ts` depende de `openai`, pero `openai` no esta declarado en `package.json`.

### 4. Riesgo de deuda por ramas de producto paralelas

La coexistencia de componentes base y `PRO` sugiere dos direcciones de producto sin consolidacion.

### 5. Export inconsistente con el scene graph

El exportador actual no representa toda la jerarquia, estilos avanzados, assets ni layout responsivo real del editor.

## Estado de compilacion verificado

La revision con `npx tsc --noEmit` falla. Esto confirma que el repo no esta en un estado tipado consistente y que parte del codigo presente no puede considerarse listo para evolucionar sin estabilizacion previa.

## Recomendacion arquitectonica para Fase 1

Antes de agregar nuevas capacidades, conviene fijar un solo backbone:

1. store unica,
2. scene graph oficial,
3. shell de editor oficial,
4. pipeline IA unico,
5. exportador acotado al modelo oficial.
