import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeAccess, buildAccessMatrix, demoGrants, filterFindings, normalizeGrant, parseAccessText, reviewSummary } from '../core.js'

const reviewDate = new Date('2026-08-08T12:00:00Z')

test('normalizes common entitlement aliases', () => {
  const grant = normalizeGrant({ identity: 'Alex', team: 'Ops', application: 'Console', entitlement: 'Admin', access_level: 'owner', last_activity: '2026-08-01' })
  assert.equal(grant.user, 'Alex')
  assert.equal(grant.resource, 'Console')
  assert.equal(grant.permission, 'owner')
})

test('parses JSON and quoted CSV access exports', () => {
  assert.equal(parseAccessText(JSON.stringify(demoGrants.slice(0, 2))).length, 2)
  const csv = 'user,resource,role,lastUsed\nAlex,Finance,"Requester, Tier 2",2026-08-01'
  assert.equal(parseAccessText(csv)[0].role, 'Requester, Tier 2')
})

test('validates bounded imports and makes duplicate grant identifiers stable', () => {
  const grants = parseAccessText(JSON.stringify([
    { id: 'same', user: 'Alex', resource: 'Console', role: 'Reader' },
    { id: 'same', user: 'Alex', resource: 'Docs', role: 'Editor' },
  ]))
  assert.deepEqual(grants.map((grant) => grant.id), ['same', 'same-2'])
  assert.throws(() => parseAccessText('[{"user":"Alex"}]'), /identity, resource, and role/)
  assert.throws(() => parseAccessText(JSON.stringify(Array.from({ length: 5001 }, () => ({ user: 'Alex', resource: 'Docs', role: 'Reader' })))), /5000 grants/)
})

test('detects lifecycle, segregation, dormancy, and privilege findings', () => {
  const grants = demoGrants.map(normalizeGrant)
  const findings = analyzeAccess(grants, reviewDate)
  for (const kind of ['disabled-access', 'sod-conflict', 'dormant-access', 'standing-privilege', 'contractor-privilege', 'missing-owner']) {
    assert.ok(findings.some((finding) => finding.kind === kind), `missing ${kind}`)
  }
})

test('filters findings by severity and search text', () => {
  const findings = analyzeAccess(demoGrants.map(normalizeGrant), reviewDate)
  assert.ok(filterFindings(findings, { severity: 'critical' }).every((finding) => finding.severity === 'critical'))
  assert.ok(filterFindings(findings, { query: 'Morgan' }).length >= 1)
})

test('builds a complete identity-resource matrix', () => {
  const grants = demoGrants.map(normalizeGrant)
  const matrix = buildAccessMatrix(grants)
  assert.ok(matrix.users.includes('Avery Chen'))
  assert.equal(matrix.cells.get('Avery Chen\u0000Ledger Pro').length, 2)
})

test('calculates review progress from documented decisions', () => {
  const grants = demoGrants.map(normalizeGrant)
  const findings = analyzeAccess(grants, reviewDate)
  const decisions = { [findings[0].id]: { decision: 'revoke' } }
  const summary = reviewSummary(grants, findings, decisions)
  assert.equal(summary.resolved, 1)
  assert.ok(summary.progress > 0)
})
