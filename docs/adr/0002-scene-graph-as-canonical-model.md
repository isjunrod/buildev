# ADR 0002: Use a Semantic Scene Graph as the Canonical Product Model

## Status

Accepted

## Context

The product must support chat generation, manual editing, screenshot reconstruction, and code export without losing semantic intent. A flat visual element list is insufficient.

## Decision

Introduce a semantic scene graph that stores:

- hierarchy and layout
- visual styling
- semantic role and component intent
- provenance
- export metadata

All major flows must read from and write to this model.

## Consequences

### Positive

- shared model across AI, canvas, export and vision
- more reliable transformations
- better future support for reusable components and tokens

### Negative

- initial model design is more complex
- every subsystem must respect a stronger contract
