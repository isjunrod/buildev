# ADR-001: Arquitectura del editor

## Estado

Aprobado para Fase 0 como decision de documentacion.

## Contexto

El repositorio contiene varias superficies relacionadas con el editor:

- shell principal: `EditorView.tsx`
- canvas base: `Canvas.tsx`
- canvas alterno: `Canvas_PRO.tsx`
- sidebars y paneles base
- sidebars y paneles `PRO`

La composicion actual del editor mezcla piezas base y `PRO`, pero la store oficial verificada (`lib/store.ts`) no satisface el contrato requerido por varios paneles `PRO`.

## Decision

Para las siguientes fases se considerara que la arquitectura oficial del editor debe ser:

- un solo shell de editor,
- una sola store oficial,
- una sola familia de paneles compatibles con esa store,
- modos claramente definidos: `design`, `code`, `preview`.

Durante Fase 0 no se modifica la implementacion. Solo se documenta que la direccion correcta es consolidar el editor sobre el shell actual en lugar de seguir multiplicando superficies paralelas.

## Razonamiento

Esta decision reduce:

- divergencia entre UI y modelo,
- APIs fantasma en la store,
- deuda de mantenimiento,
- riesgo de romper el canvas al agregar features.

## Consecuencias

### Positivas

- menor complejidad cognitiva,
- integracion mas simple con IA y export,
- pruebas y tipado mas viables.

### Negativas

- sera necesario retirar, adaptar o posponer partes del set `PRO`,
- algunas pantallas visualmente mas avanzadas pueden perder prioridad hasta quedar soportadas por el modelo oficial.

## Seguimiento para Fase 1

1. Declarar cual es la superficie oficial.
2. Auditar que componentes quedan fuera de contrato.
3. Decidir si se adapta la store al set `PRO` o se reduce temporalmente el set activo.
