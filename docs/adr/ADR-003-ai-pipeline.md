# ADR-003: Pipeline de IA

## Estado

Aprobado para Fase 0 como decision de documentacion.

## Contexto

Hoy existen al menos tres intenciones de IA en el repo:

1. generacion de componentes desde prompt,
2. refinement/modificacion de elementos,
3. analisis de screenshot para reverse UI.

Tambien existen dos capas de servicio solapadas:

- `lib/aiService.ts`
- `lib/ai-service.ts`

Y varios proveedores/modelos:

- Anthropic via AI SDK,
- Gemini,
- Groq,
- mock fallback.

## Decision

La direccion oficial del sistema sera un pipeline IA unificado por intentos, no por componente visual. Cada intento de IA debe usar:

- un contrato de entrada/salida claro,
- una capa de servicio unica,
- un selector de proveedor consistente,
- manejo de fallback y errores centralizado.

## Pipeline objetivo

### Intentos oficiales

- `generate-component`
- `refine-element`
- `analyze-screenshot`
- `generate-responsive` si sigue siendo parte del producto

### Forma de trabajo

1. La UI llama a una sola capa cliente.
2. La capa cliente invoca una ruta o servicio con contrato tipado.
3. La respuesta se valida y transforma al scene graph oficial.
4. La store recibe solo datos compatibles con el modelo oficial.

## Razonamiento

Esto evita:

- duplicacion de logica,
- configuraciones de entorno incompatibles,
- respuestas de IA que llegan directo a componentes sin pasar por contrato estable.

## Consecuencias

### Positivas

- mas trazabilidad,
- menos deuda entre prompts, providers y store,
- integracion mas segura con reverse UI y export.

### Negativas

- obliga a consolidar codigo existente antes de seguir agregando flujos IA.

## Seguimiento para Fase 1

1. Consolidar servicios en una sola capa.
2. Normalizar nombres de variables de entorno.
3. Verificar dependencias faltantes y providers realmente soportados.
4. Tipar y validar todas las respuestas IA antes de insertarlas en la store.
