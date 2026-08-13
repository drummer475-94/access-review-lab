import test from 'node:test'
import assert from 'node:assert/strict'
import { parseAccessText, parseEntraIdExport, parseOktaExport } from '../core.js'

test('parses Entra ID (Azure AD) identity and entitlement JSON exports', () => {
  const entraData = {
    users: [
      {
        userPrincipalName: 'alex.monroe@company.com',
        displayName: 'Alex Monroe',
        jobTitle: 'Financial Controller',
        department: 'Finance',
        accountEnabled: true,
        userType: 'Member',
        lastSignInDateTime: '2026-08-01T12:00:00Z',
        manager: 'CFO',
        assignedRoles: ['Global Administrator', 'User Access Administrator']
      },
      {
        userPrincipalName: 'guest.vendor@partner.com',
        displayName: 'Guest Vendor',
        jobTitle: 'Consultant',
        department: 'External',
        accountEnabled: false,
        userType: 'Guest',
        lastSignInDateTime: '2025-10-01T08:00:00Z',
        assignedRoles: ['Reader']
      }
    ]
  }

  const grants = parseEntraIdExport(entraData)
  assert.equal(grants.length, 3)
  assert.equal(grants[0].user, 'alex.monroe@company.com')
  assert.equal(grants[0].accountStatus, 'active')
  assert.equal(grants[0].role, 'Global Administrator')
  assert.equal(grants[0].permission, 'admin')

  assert.equal(grants[2].user, 'guest.vendor@partner.com')
  assert.equal(grants[2].accountStatus, 'disabled')
  assert.equal(grants[2].accountType, 'contractor')

  const parsedText = parseAccessText(JSON.stringify(entraData))
  assert.equal(parsedText.length, 3)
})

test('parses Okta identity and entitlement exports', () => {
  const oktaData = {
    users: [
      {
        login: 'sam.taylor@company.com',
        email: 'sam.taylor@company.com',
        firstName: 'Sam',
        lastName: 'Taylor',
        status: 'ACTIVE',
        userType: 'EMPLOYEE',
        department: 'Engineering',
        lastLogin: '2026-08-07T10:00:00Z',
        apps: [
          { appName: 'GitHub Enterprise', appRole: 'Organization Administrator' },
          { appName: 'AWS SSO', appRole: 'PowerUserAccess' }
        ]
      },
      {
        login: 'terminated.user@company.com',
        status: 'DEPROVISIONED',
        userType: 'CONTRACTOR',
        department: 'Sales',
        lastLogin: '2025-05-01T00:00:00Z',
        apps: [
          { appName: 'Salesforce CRM', appRole: 'System Administrator' }
        ]
      }
    ]
  }

  const grants = parseOktaExport(oktaData)
  assert.equal(grants.length, 3)
  assert.equal(grants[0].user, 'sam.taylor@company.com')
  assert.equal(grants[0].resource, 'GitHub Enterprise')

  assert.equal(grants[2].user, 'terminated.user@company.com')
  assert.equal(grants[2].accountStatus, 'disabled')
  assert.equal(grants[2].accountType, 'contractor')

  const parsedText = parseAccessText(JSON.stringify(oktaData))
  assert.equal(parsedText.length, 3)
})

test('handles malformed Entra ID export payloads with null elements in assignedRoles without crashing', () => {
  const malformedEntra = {
    users: [
      {
        userPrincipalName: 'null.role@company.com',
        displayName: 'Null Role User',
        accountEnabled: true,
        assignedRoles: [null, { displayName: 'Global Reader' }]
      }
    ]
  }
  const grants = parseEntraIdExport(malformedEntra)
  assert.equal(grants.length, 2)
  assert.equal(grants[0].user, 'null.role@company.com')
  assert.equal(grants[0].role, 'Assigned Role')
  assert.equal(grants[1].role, 'Global Reader')

  const parsedText = parseAccessText(JSON.stringify(malformedEntra))
  assert.equal(parsedText.length, 2)
})

test('handles malformed Okta export payloads with null elements in apps without crashing', () => {
  const malformedOkta = {
    users: [
      {
        login: 'null.app@company.com',
        status: 'ACTIVE',
        apps: [null, { appName: 'Slack', appRole: 'User' }]
      }
    ]
  }
  const grants = parseOktaExport(malformedOkta)
  assert.equal(grants.length, 2)
  assert.equal(grants[0].user, 'null.app@company.com')
  assert.equal(grants[0].resource, 'Okta SSO')
  assert.equal(grants[0].role, 'Member')
  assert.equal(grants[1].resource, 'Slack')

  const parsedText = parseAccessText(JSON.stringify(malformedOkta))
  assert.equal(parsedText.length, 2)
})
