# ADR 0003: Reverse UI Engineering Uses a Hybrid Heuristic + AI Pipeline

## Status

Accepted

## Context

Pure LLM guessing is too unreliable for screenshot reconstruction, while pure heuristics are too brittle to infer useful semantics alone.

## Decision

Implement reverse UI engineering as a staged hybrid pipeline:

1. image preprocessing
2. heuristic block and text region detection
3. repeated-pattern inference
4. optional provider-assisted semantic normalization
5. reconstruction into editable semantic nodes

## Consequences

### Positive

- better determinism and debuggability
- graceful degradation without provider access
- explicit room for OCR and CV upgrades later

### Negative

- more pipeline code than a simple model call
- MVP quality depends on well-chosen heuristics
