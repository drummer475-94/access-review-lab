import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeAccess, demoGrants, getComplianceControls, normalizeGrant } from '../core.js'

test('tags findings with SOX 404, SOC 2 CC6.1-CC6.3, and CIS Controls v8 (Controls 5 & 6)', () => {
  const controlsMap = {
    'disabled-access': getComplianceControls('disabled-access'),
    'sod-conflict': getComplianceControls('sod-conflict'),
    'dormant-access': getComplianceControls('dormant-access'),
    'standing-privilege': getComplianceControls('standing-privilege'),
    'contractor-privilege': getComplianceControls('contractor-privilege'),
    'missing-owner': getComplianceControls('missing-owner'),
    'toxic-combination': getComplianceControls('toxic-combination')
  }

  // Check specific compliance framework strings
  assert.ok(controlsMap['disabled-access'].some(c => c.includes('SOX 404')))
  assert.ok(controlsMap['disabled-access'].some(c => c.includes('SOC 2 CC6.3')))
  assert.ok(controlsMap['disabled-access'].some(c => c.includes('CIS Controls v8 Control 5.3')))

  assert.ok(controlsMap['sod-conflict'].some(c => c.includes('SOX 404')))
  assert.ok(controlsMap['sod-conflict'].some(c => c.includes('SOC 2 CC6.1')))

  assert.ok(controlsMap['standing-privilege'].some(c => c.includes('CIS Controls v8 Control 6.8')))

  const grants = demoGrants.map(normalizeGrant)
  const findings = analyzeAccess(grants, new Date('2026-08-08T12:00:00Z'))

  findings.forEach(f => {
    assert.ok(Array.isArray(f.complianceControls), `Finding ${f.id} should have complianceControls array`)
    assert.ok(f.complianceControls.length > 0, `Finding ${f.id} complianceControls array should not be empty`)
  })
})
