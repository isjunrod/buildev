# Roadmap

## Fase 0

### Objetivo

Inspeccionar el repositorio y establecer una base documental verificable.

### Resultado

Completado en esta iteracion:

- inventario funcional del repo,
- mapa del sistema,
- diagnostico de deuda tecnica,
- ADRs iniciales para editor, scene graph y pipeline IA.

## Fase 1

### Objetivo

Estabilizar el nucleo existente sin agregar features nuevas.

### Alcance propuesto

1. Elegir una sola superficie oficial del editor.
2. Alinear `lib/types.ts` con las necesidades reales del editor activo.
3. Alinear `lib/store.ts` con todos los consumidores vigentes o retirar consumidores fuera de contrato.
4. Resolver errores de TypeScript del repo.
5. Unificar `lib/aiService.ts` y `lib/ai-service.ts`.
6. Definir contrato minimo para `importElements` y flujo reverse UI.
7. Definir alcance real del export MVP y ajustarlo al modelo de datos.

### Entregables

- repo compilando con `npx tsc --noEmit`,
- un editor oficial claramente delimitado,
- store y tipos sin APIs fantasma,
- pipeline de reverse UI conectado al scene graph oficial,
- exportacion MVP documentada y verificable.

## Fase 2

### Objetivo

Mejorar experiencia y consistencia sobre el nucleo estable.

### Posibles lineas

- persistencia real con Dexie,
- historial undo/redo,
- assets y design tokens con contrato tipado,
- constraints/autolayout si se incorporan de forma oficial,
- refinement de elementos con IA dentro del canvas.

## Fase 3

### Objetivo

Preparar un flujo de builder mas cercano a producto.

### Posibles lineas

- exportacion multiarchivo real,
- componentes reutilizables mas robustos,
- preview mas fiel a breakpoints,
- observabilidad y telemetria de flujos IA,
- preparacion para colaboracion o sharing real.

## Secuencia recomendada

La prioridad recomendada es:

1. estabilidad del nucleo,
2. consolidacion del modelo,
3. integracion de IA,
4. mejora de export/persistencia,
5. nuevas capacidades.
