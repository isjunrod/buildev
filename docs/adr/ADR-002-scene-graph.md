# ADR-002: Scene graph

## Estado

Aprobado para Fase 0 como decision de documentacion.

## Contexto

El modelo verificado actual usa `SiteElement` como nodo del canvas:

- jerarquia mediante `children`,
- geometria absoluta (`x`, `y`, `width`, `height`),
- tipo de elemento,
- estilos basicos,
- responsive overrides por breakpoint.

Ese modelo ya alcanza para el canvas base, preview y parte del export. Sin embargo, no cubre las expectativas de varios paneles avanzados que intentan usar propiedades no declaradas.

## Decision

El scene graph oficial debe seguir siendo un arbol jerarquico de nodos serializables, con `SiteElement` como base, y debe convertirse en la unica fuente de verdad para:

- canvas,
- preview,
- export,
- reverse UI import,
- componentes reutilizables.

La evolucion del modelo debe hacerse de forma explicita y tipada, evitando agregar propiedades ad hoc desde componentes aislados.

## Principios

1. El scene graph debe ser serializable.
2. El scene graph debe poder importarse desde IA.
3. El scene graph debe poder exportarse a codigo.
4. Toda capacidad visual nueva debe declarar su extension de esquema antes de usarse en UI.

## Consecuencias

### Positivas

- compatibilidad clara entre editor, IA y export,
- menor deuda por propiedades informales,
- mejor base para persistencia.

### Negativas

- cualquier feature avanzada requiere primero una decision de esquema,
- algunos paneles actuales no podran mantenerse sin refactor.

## Seguimiento para Fase 1

1. Definir version 1 del schema oficial del nodo.
2. Agregar solo los campos realmente necesarios para el editor elegido.
3. Establecer reglas de migracion si existen nodos legacy o mock data.
