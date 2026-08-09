# Access Review Lab

[![Tests](https://github.com/drummer475-94/access-review-lab/actions/workflows/pages.yml/badge.svg)](https://github.com/drummer475-94/access-review-lab/actions/workflows/pages.yml)

Access Review Lab is a static identity-governance workspace for access certification. It turns CSV or JSON entitlement exports into a searchable finding queue, an identity-by-resource matrix, and a documented review package.

**[Open the live app](https://drummer475-94.github.io/access-review-lab/)**

## 60-second review

1. Start with the ten open findings in the sample certification summary.
2. Review **Request and approval duties overlap** to see the affected grants and suggested separation-of-duties response.
3. Record a certification decision, inspect the identity-by-resource matrix, and export the review trail.

The implementation is framework-free, has no runtime dependencies, processes entitlement data locally, and isolates its tested normalization and policy rules in [`core.js`](core.js).

## Portfolio value

The product makes IAM and governance skills observable: data normalization, identity lifecycle review, least-privilege analysis, segregation of duties, privileged-access review, traceable decisions, and privacy-aware client-side processing.

## Included controls

- Disabled or inactive identities that retain grants
- Request-and-approval role conflicts on the same resource
- Access unused for more than 90 or 180 days
- Permanent privileged roles
- Privileged third-party access
- Resources without an accountable owner

The built-in rules are review prompts, not claims of compliance. An actual certification must use authoritative identity data and organization-approved policies.

## Professional grounding

The analysis themes follow [CISA identity and access management best practices](https://www.cisa.gov/sites/default/files/2023-12/ESF%20IDENTITY%20AND%20ACCESS%20MANAGEMENT%20RECOMMENDED%20BEST%20PRACTICES%20FOR%20ADMINISTRATORS%20PP-23-0248_508C.pdf), including least privilege, separation of duties, entitlement review, privileged-access governance, and account lifecycle management.

## Run and verify

No dependency install or build is required.

```powershell
npm run check
npm test
python -m http.server 4174
```

Open `http://localhost:4174`.

## GitHub Pages

The included workflow deploys the repository root. Push the project to a GitHub repository on `main`, then configure **Settings → Pages → Source** as **GitHub Actions**.
