export const severityRank = { critical: 4, high: 3, medium: 2, low: 1 }

export const demoGrants = [
  { user: 'Avery Chen', department: 'Finance', manager: 'D. Foster', accountStatus: 'active', accountType: 'employee', resource: 'Ledger Pro', role: 'Finance Requester', permission: 'write', accessType: 'permanent', lastUsed: '2026-08-04', resourceOwner: 'Controller' },
  { user: 'Avery Chen', department: 'Finance', manager: 'D. Foster', accountStatus: 'active', accountType: 'employee', resource: 'Ledger Pro', role: 'Finance Approver', permission: 'approve', accessType: 'permanent', lastUsed: '2026-08-07', resourceOwner: 'Controller' },
  { user: 'Avery Chen', department: 'Finance', manager: 'D. Foster', accountStatus: 'active', accountType: 'employee', resource: 'Expense Cloud', role: 'Submitter', permission: 'write', accessType: 'permanent', lastUsed: '2026-08-05', resourceOwner: 'Finance Ops' },
  { user: 'Morgan Webb', department: 'Sales', manager: 'R. Cole', accountStatus: 'disabled', accountType: 'employee', resource: 'Sales CRM', role: 'CRM Administrator', permission: 'admin', accessType: 'permanent', lastUsed: '2025-12-12', resourceOwner: 'Revenue Ops' },
  { user: 'Morgan Webb', department: 'Sales', manager: 'R. Cole', accountStatus: 'disabled', accountType: 'employee', resource: 'Support Desk', role: 'Agent', permission: 'write', accessType: 'permanent', lastUsed: '2025-11-28', resourceOwner: 'Support' },
  { user: 'Priya Shah', department: 'Platform', manager: 'K. Nguyen', accountStatus: 'active', accountType: 'employee', resource: 'Source Control', role: 'Organization Administrator', permission: 'admin', accessType: 'permanent', lastUsed: '2026-08-06', resourceOwner: 'Engineering' },
  { user: 'Priya Shah', department: 'Platform', manager: 'K. Nguyen', accountStatus: 'active', accountType: 'employee', resource: 'Cloud Console', role: 'Viewer', permission: 'read', accessType: 'permanent', lastUsed: '2026-08-02', resourceOwner: 'Infrastructure' },
  { user: 'Noah Reed', department: 'Vendor', manager: 'L. Brooks', accountStatus: 'active', accountType: 'contractor', resource: 'Cloud Console', role: 'Project Owner', permission: 'owner', accessType: 'permanent', lastUsed: '2026-08-01', resourceOwner: 'Infrastructure' },
  { user: 'Sam Ortega', department: 'People', manager: 'J. Fields', accountStatus: 'active', accountType: 'employee', resource: 'HR Suite', role: 'Payroll Viewer', permission: 'read', accessType: 'permanent', lastUsed: '2026-01-08', resourceOwner: 'People Ops' },
  { user: 'Sam Ortega', department: 'People', manager: 'J. Fields', accountStatus: 'active', accountType: 'employee', resource: 'Knowledge Base', role: 'Editor', permission: 'write', accessType: 'permanent', lastUsed: '2026-07-24', resourceOwner: 'Operations' },
  { user: 'svc-integrations', department: 'Platform', manager: '', accountStatus: 'active', accountType: 'service', resource: 'Data Warehouse', role: 'Pipeline Writer', permission: 'write', accessType: 'permanent', lastUsed: '2026-08-08', resourceOwner: '' },
  { user: 'Jamie Lewis', department: 'Support', manager: 'A. Ross', accountStatus: 'active', accountType: 'employee', resource: 'Support Desk', role: 'Agent', permission: 'write', accessType: 'permanent', lastUsed: '2026-08-08', resourceOwner: 'Support' },
]

const aliases = {
  user: ['user', 'identity', 'name', 'principal'],
  department: ['department', 'team', 'business_unit'],
  manager: ['manager', 'sponsor'],
  accountStatus: ['accountStatus', 'account_status', 'status'],
  accountType: ['accountType', 'account_type', 'identity_type', 'type'],
  resource: ['resource', 'application', 'system', 'asset'],
  role: ['role', 'entitlement', 'group'],
  permission: ['permission', 'privilege', 'access_level'],
  accessType: ['accessType', 'access_type', 'assignment'],
  lastUsed: ['lastUsed', 'last_used', 'last_activity'],
  resourceOwner: ['resourceOwner', 'resource_owner', 'owner'],
}

function first(record, keys) {
  for (const key of keys) if (record[key] !== undefined && String(record[key]).trim()) return String(record[key]).trim()
  return ''
}

export function normalizeGrant(record, index = 0) {
  const input = record && typeof record === 'object' ? record : {}
  return {
    id: String(input.id || `grant-${index + 1}`),
    user: first(input, aliases.user) || 'Unknown identity',
    department: first(input, aliases.department) || 'Unassigned',
    manager: first(input, aliases.manager),
    accountStatus: (first(input, aliases.accountStatus) || 'active').toLowerCase(),
    accountType: (first(input, aliases.accountType) || 'employee').toLowerCase(),
    resource: first(input, aliases.resource) || 'Unknown resource',
    role: first(input, aliases.role) || 'Unspecified role',
    permission: (first(input, aliases.permission) || 'read').toLowerCase(),
    accessType: (first(input, aliases.accessType) || 'permanent').toLowerCase(),
    lastUsed: first(input, aliases.lastUsed),
    resourceOwner: first(input, aliases.resourceOwner),
  }
}

function parseCsvLine(line) {
  const cells = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { cell += '"'; index += 1 } else quoted = !quoted
    } else if (character === ',' && !quoted) { cells.push(cell.trim()); cell = '' } else cell += character
  }
  cells.push(cell.trim())
  return cells
}

export function parseAccessText(text) {
  const source = String(text || '').trim()
  if (!source) throw new Error('The selected file is empty.')
  let records
  try {
    const parsed = JSON.parse(source)
    records = Array.isArray(parsed) ? parsed : Array.isArray(parsed.grants) ? parsed.grants : [parsed]
  } catch {
    const lines = source.split(/\r?\n/).filter((line) => line.trim())
    if (lines.length < 2) throw new Error('Use a JSON array or CSV with a header row.')
    const headers = parseCsvLine(lines[0])
    records = lines.slice(1).map((line) => {
      const values = parseCsvLine(line)
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
    })
  }
  const grants = records.map(normalizeGrant)
  if (!grants.length) throw new Error('No access grants were found.')
  return grants
}

function finding(kind, severity, title, grantIds, summary, recommendation) {
  return { id: `${kind}:${grantIds.join('|')}`, kind, severity, title, grantIds, summary, recommendation }
}

function groupBy(items, keyFor) {
  const groups = new Map()
  items.forEach((item) => {
    const key = keyFor(item)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })
  return groups
}

function daysSince(value, reviewTime) {
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? Math.floor((reviewTime - time) / 86400000) : null
}

export function analyzeAccess(grants, reviewDate = new Date()) {
  const reviewTime = new Date(reviewDate).getTime()
  const findings = []
  const byUser = groupBy(grants, (grant) => grant.user)

  for (const [user, userGrants] of byUser) {
    if (userGrants.some((grant) => ['disabled', 'terminated', 'inactive'].includes(grant.accountStatus))) {
      findings.push(finding('disabled-access', 'critical', 'Disabled identity retains access', userGrants.map((grant) => grant.id), `${user} still has ${userGrants.length} assignment${userGrants.length === 1 ? '' : 's'} across ${new Set(userGrants.map((grant) => grant.resource)).size} resources.`, 'Confirm the identity lifecycle event, revoke active sessions, and remove retained grants.'))
    }

    const byResource = groupBy(userGrants, (grant) => grant.resource)
    for (const [resource, resourceGrants] of byResource) {
      const roles = resourceGrants.map((grant) => grant.role.toLowerCase())
      const canRequest = roles.some((role) => /request|submit|create/.test(role))
      const canApprove = roles.some((role) => /approv|authorize|release/.test(role))
      if (canRequest && canApprove) {
        findings.push(finding('sod-conflict', 'critical', 'Request and approval duties overlap', resourceGrants.map((grant) => grant.id), `${user} can both initiate and approve activity in ${resource}.`, 'Separate request and approval roles or document a time-bound compensating control.'))
      }
    }

    for (const grant of userGrants) {
      const inactivity = daysSince(grant.lastUsed, reviewTime)
      if (inactivity !== null && inactivity > 90) {
        const severity = inactivity > 180 ? 'high' : 'medium'
        findings.push(finding('dormant-access', severity, 'Dormant access assignment', [grant.id], `${grant.user} has not used ${grant.resource} for ${inactivity} days.`, 'Confirm ongoing business need; remove the grant if it is no longer required.'))
      }
      const privileged = /admin|owner|root|superuser/.test(`${grant.role} ${grant.permission}`.toLowerCase())
      if (privileged && grant.accessType === 'permanent') {
        findings.push(finding('standing-privilege', 'high', 'Standing privileged access', [grant.id], `${grant.user} holds permanent ${grant.role} access to ${grant.resource}.`, 'Prefer eligible or just-in-time privilege and require a documented approval path.'))
      }
      if (privileged && grant.accountType === 'contractor') {
        findings.push(finding('contractor-privilege', 'high', 'Contractor has privileged access', [grant.id], `${grant.user} is a contractor with ${grant.role} access to ${grant.resource}.`, 'Validate sponsor, end date, and least-privilege scope; convert to time-bound access where possible.'))
      }
      if (!grant.resourceOwner) {
        findings.push(finding('missing-owner', 'medium', 'Resource has no accountable owner', [grant.id], `${grant.resource} has an assignment but no resource owner in the review data.`, 'Assign an accountable owner before certifying this access.'))
      }
    }
  }

  return findings.sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || a.title.localeCompare(b.title))
}

export function filterFindings(findings, filters = {}) {
  const query = String(filters.query || '').toLowerCase().trim()
  return findings.filter((item) => {
    if (filters.severity && item.severity !== filters.severity) return false
    if (filters.kind && item.kind !== filters.kind) return false
    return !query || `${item.title} ${item.summary} ${item.recommendation}`.toLowerCase().includes(query)
  })
}

export function buildAccessMatrix(grants) {
  const users = [...new Set(grants.map((grant) => grant.user))].sort()
  const resources = [...new Set(grants.map((grant) => grant.resource))].sort()
  const cells = new Map()
  grants.forEach((grant) => {
    const key = `${grant.user}\u0000${grant.resource}`
    if (!cells.has(key)) cells.set(key, [])
    cells.get(key).push(grant)
  })
  return { users, resources, cells }
}

export function reviewSummary(grants, findings, decisions = {}) {
  const resolved = findings.filter((item) => decisions[item.id]?.decision && decisions[item.id].decision !== 'pending').length
  return {
    identities: new Set(grants.map((grant) => grant.user)).size,
    resources: new Set(grants.map((grant) => grant.resource)).size,
    findings: findings.length,
    resolved,
    progress: findings.length ? Math.round((resolved / findings.length) * 100) : 100,
  }
}
