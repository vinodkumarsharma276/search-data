# Codebase Cleanup Plan (Executed)

This document records files identified as unused and removed in the `vinodsharma/clean-codebase` branch.

## Frontend Removals

Scheduled (pending deletion in subsequent commit) – to confirm routing usage before final delete:

- `frontend/src/components/AddProductTable.jsx` (no imports / no route usage)
- `frontend/src/components/Dashboard.jsx.backup` (backup artifact)
- Experimental legacy search/product pages (not present or already removed): `SearchPageNew.jsx`, `SearchPageFixed.jsx`, `AddProduct_fixed.jsx`.

## Backend Script Consolidation (candidates)

Retain:

- seed-category-clean.js
- seed-dummy-products.js
- seed-35-distributors.js (seeding reference data)
- seed-customers.js
- migrate-price-to-mrp.js (recent schema change)
- count-products.js / show-products.js / clear-products.js (basic diagnostics)

Remove (next step):

- Older / superseded seeds: seed-category-hierarchy.js, seed-category-hierarchy-new.js, seed-clean-categories.js, seed-dummy-data.js, seed-comprehensive-data.js, seed-inventory-data.js, seed-products.js
- One-off check scripts: check-all-categories.js, check-categories-clean.js, check-categories.js, detailed-product-check.js, simple-seed-categories.js, fix-electronics.js, update-(various) scripts, test-(various) scripts (manual/legacy) unless formal tests maintained elsewhere.

## Next Actions

1. Validate no production process references removed scripts.
2. Delete listed files.
3. Add MAINTENANCE.md with retained tooling explanation.

(Adjust this list before final deletion if needed.)
