## Maintenance & Tooling Overview

This branch removed legacy / unused scripts and experimental components to streamline the codebase.

Retained key backend scripts (in `backend/scripts/`):
- seed-category-clean.js
- seed-dummy-products.js
- seed-35-distributors.js
- seed-customers.js
- migrate-price-to-mrp.js
- migrate-existing-products-label-check.js (temporary)
- count-products.js / show-products.js / clear-products.js

If a removed script is required again, recover it via git history.

Keep this file updated when operational scripts change.
