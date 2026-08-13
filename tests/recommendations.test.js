import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculatePrivilegeRiskScore,
  recommendRoleRightSizing,
  detectToxicCombinations,
  analyzeAccess,
  normalizeGrant
} from '../core.js'

test('calculates numerical privilege risk scores and risk tiers', () => {
  const disabledGrant = normalizeGrant({
    user: 'Former Employee',
    accountStatus: 'disabled',
    role: 'Global Admin',
    permission: 'admin',
    resource: 'AWS Console'
  })
  
  const risk = calculatePrivilegeRiskScore(disabledGrant)
  assert.ok(risk.score >= 65, `Expected high risk score for disabled admin, got ${risk.score}`)
  assert.ok(risk.factors.length > 0)
})

test('provides role right-sizing recommendations for over-privileged accounts', () => {
  const financeAdminGrant = normalizeGrant({
    user: 'Avery Chen',
    department: 'Finance',
    role: 'Global Administrator',
    permission: 'admin',
    resource: 'Entra ID',
    accountType: 'employee',
    accessType: 'permanent'
  })

  const recommendation = recommendRoleRightSizing(financeAdminGrant)
  assert.equal(recommendation.isOverPrivileged, true)
  assert.ok(recommendation.recommendedRole.includes('Requester') || recommendation.recommendedRole.includes('Eligible'))
  assert.ok(recommendation.rationale.includes('Finance'))

  const contractorGrant = normalizeGrant({
    user: 'Vendor User',
    department: 'Vendor',
    role: 'System Owner',
    permission: 'owner',
    resource: 'Cloud Infrastructure',
    accountType: 'contractor',
    accessType: 'permanent'
  })

  const contractorRec = recommendRoleRightSizing(contractorGrant)
  assert.equal(contractorRec.isOverPrivileged, true)
  assert.ok(contractorRec.recommendedRole.includes('Time-Bound') || contractorRec.recommendedRole.includes('JIT'))
})

test('detects toxic role combinations across systems', () => {
  const toxicGrants = [
    normalizeGrant({ user: 'Dev Lead', department: 'Engineering', resource: 'Source Control', role: 'Organization Administrator', permission: 'admin' }),
    normalizeGrant({ user: 'Dev Lead', department: 'Engineering', resource: 'Cloud Console', role: 'Project Owner', permission: 'owner' }),
  ]

  const toxicFindings = detectToxicCombinations(toxicGrants)
  assert.equal(toxicFindings.length, 1)
  assert.equal(toxicFindings[0].kind, 'toxic-combination')
  assert.equal(toxicFindings[0].severity, 'critical')
  assert.ok(toxicFindings[0].summary.includes('Source Control Admin and Production Cloud Console Owner'))

  const fullFindings = analyzeAccess(toxicGrants, new Date('2026-08-08T12:00:00Z'))
  assert.ok(fullFindings.some(f => f.kind === 'toxic-combination'))
})
