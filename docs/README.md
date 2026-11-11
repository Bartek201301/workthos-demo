# Docs

The human writes and changes these files. Builders read them only (the `docs` lane in `owners.yml`).

- `docs/prd.md`: what the product is and why.
- `docs/spec.md`: how it works.
- `docs/design.md`: how it looks (colors, type, spacing, layout, how components look).

## Which wins on a conflict

This is the default order. You may change it in this file.

1. `prd.md` wins over `spec.md` on scope and behavior.
2. `design.md` decides visual matters only. When a visual choice conflicts with a requirement in `prd.md`, `prd.md` wins.

Whatever the order, the lead records every conflict it finds and asks you before it acts. The order only tells the lead what to propose.
