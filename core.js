export const severityRank = { critical: 4, high: 3, medium: 2, low: 1 }

const maxImportedGrants = 5000

function boundedText(value, maximum) {
  return String(value ?? '').trim().slice(0, maximum)
}

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
  user: ['user', 'identity', 'name', 'principal', 'userPrincipalName', 'login', 'email', 'displayName'],
  department: ['department', 'team', 'business_unit'],
  manager: ['manager', 'sponsor'],
  accountStatus: ['accountStatus', 'account_status', 'status', 'accountEnabled'],
  accountType: ['accountType', 'account_type', 'identity_type', 'type', 'userType'],
  resource: ['resource', 'application', 'system', 'asset', 'appName'],
  role: ['role', 'entitlement', 'group', 'assignedRoles', 'appRole', 'groupName'],
  permission: ['permission', 'privilege', 'access_level'],
  accessType: ['accessType', 'access_type', 'assignment'],
  lastUsed: ['lastUsed', 'last_used', 'last_activity', 'lastSignInDateTime', 'lastLogin'],
  resourceOwner: ['resourceOwner', 'resource_owner', 'owner'],
}

function first(record, keys) {
  for (const key of keys) if (record[key] !== undefined && record[key] !== null && String(record[key]).trim()) return String(record[key]).trim()
  return ''
}

export function normalizeGrant(record, index = 0) {
  const input = record && typeof record === 'object' ? record : {}
  let statusVal = first(input, aliases.accountStatus) || 'active'
  if (statusVal === 'false' || statusVal === 'DEPROVISIONED' || statusVal === 'SUSPENDED' || statusVal === 'inactive') {
    statusVal = 'disabled'
  } else if (statusVal === 'true' || statusVal === 'ACTIVE') {
    statusVal = 'active'
  }

  let typeVal = first(input, aliases.accountType) || 'employee'
  if (typeVal.toLowerCase().includes('guest') || typeVal.toLowerCase().includes('vendor') || typeVal.toLowerCase().includes('contractor')) {
    typeVal = 'contractor'
  }

  return {
    id: boundedText(input.id || `grant-${index + 1}`, 120),
    user: boundedText(first(input, aliases.user) || 'Unknown identity', 120),
    department: boundedText(first(input, aliases.department) || 'Unassigned', 80),
    manager: boundedText(first(input, aliases.manager), 120),
    accountStatus: boundedText(statusVal || 'active', 40).toLowerCase(),
    accountType: boundedText(typeVal || 'employee', 40).toLowerCase(),
    resource: boundedText(first(input, aliases.resource) || 'Unknown resource', 120),
    role: boundedText(first(input, aliases.role) || 'Unspecified role', 120),
    permission: boundedText(first(input, aliases.permission) || 'read', 80).toLowerCase(),
    accessType: boundedText(first(input, aliases.accessType) || 'permanent', 40).toLowerCase(),
    lastUsed: boundedText(first(input, aliases.lastUsed), 40),
    resourceOwner: boundedText(first(input, aliases.resourceOwner), 120),
  }
}

function uniqueGrantIds(grants) {
  const used = new Set()
  return grants.map((grant) => {
    let id = grant.id
    let suffix = 2
    while (used.has(id)) { id = `${grant.id}-${suffix}`; suffix += 1 }
    used.add(id)
    return id === grant.id ? grant : { ...grant, id }
  })
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
  if (quoted) throw new Error('CSV contains an unterminated quoted field.')
  cells.push(cell.trim())
  return cells
}

// Entra ID Export Parser
export function parseEntraIdExport(entraObj) {
  if (!entraObj) return []
  const rawUsers = Array.isArray(entraObj)
    ? entraObj
    : Array.isArray(entraObj.users)
    ? entraObj.users
    : Array.isArray(entraObj.value)
    ? entraObj.value
    : [entraObj]

  const grants = []
  rawUsers.forEach((u, uIdx) => {
    if (!u || typeof u !== 'object') u = {}
    const user = u.userPrincipalName || u.displayName || u.user || 'Unknown identity'
    const department = u.department || u.jobTitle || 'Unassigned'
    const accountStatus = u.accountEnabled === false || String(u.accountEnabled).toLowerCase() === 'false' ? 'disabled' : 'active'
    const accountType = u.userType === 'Guest' ? 'contractor' : 'employee'
    const lastUsed = u.signInActivity?.lastSignInDateTime || u.lastSignInDateTime || u.lastUsed || ''
    const manager = u.manager || ''

    const roles = Array.isArray(u.assignedRoles) ? u.assignedRoles : Array.isArray(u.directoryRoles) ? u.directoryRoles : [u.assignedRoles || u.role || 'User']

    roles.forEach((r, rIdx) => {
      const roleStr = r && typeof r === 'object' ? r.displayName || r.roleName || 'Assigned Role' : (r ? String(r) : 'Assigned Role')
      const resourceStr = r && typeof r === 'object' && r.resource ? r.resource : 'Entra ID (Azure AD)'
      const permStr = /admin|owner|global/i.test(roleStr) ? 'admin' : 'write'

      grants.push({
        id: `entra-${uIdx + 1}-${rIdx + 1}`,
        user,
        department,
        manager,
        accountStatus,
        accountType,
        resource: resourceStr,
        role: roleStr,
        permission: permStr,
        accessType: 'permanent',
        lastUsed,
        resourceOwner: manager || 'Entra Admin'
      })
    })
  })

  return grants
}

// Okta Export Parser
export function parseOktaExport(oktaObj) {
  if (!oktaObj) return []
  const rawUsers = Array.isArray(oktaObj)
    ? oktaObj
    : Array.isArray(oktaObj.users)
    ? oktaObj.users
    : [oktaObj]

  const grants = []
  rawUsers.forEach((u, uIdx) => {
    if (!u || typeof u !== 'object') u = {}
    const user = u.login || u.email || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown identity'
    const department = u.department || 'Unassigned'
    const status = (u.status || '').toUpperCase()
    const accountStatus = (status === 'DEPROVISIONED' || status === 'SUSPENDED' || status === 'INACTIVE') ? 'disabled' : 'active'
    const accountType = u.userType === 'CONTRACTOR' ? 'contractor' : 'employee'
    const lastUsed = u.lastLogin || u.lastUsed || ''
    const manager = u.manager || ''

    const apps = Array.isArray(u.apps) ? u.apps : Array.isArray(u.groupMemberships) ? u.groupMemberships : [{ resource: u.appName || 'Okta SSO', role: u.appRole || u.role || 'Member' }]

    apps.forEach((a, aIdx) => {
      const resource = a && typeof a === 'object' ? a.appName || a.resource || 'Okta SSO' : 'Okta SSO'
      const role = a && typeof a === 'object' ? a.appRole || a.role || a.groupName || String(a) : (a ? String(a) : 'Member')
      const permStr = /admin|owner|superuser/i.test(role) ? 'admin' : 'write'

      grants.push({
        id: `okta-${uIdx + 1}-${aIdx + 1}`,
        user,
        department,
        manager,
        accountStatus,
        accountType,
        resource,
        role,
        permission: permStr,
        accessType: 'permanent',
        lastUsed,
        resourceOwner: manager || 'Okta Admin'
      })
    })
  })

  return grants
}

export function parseAccessText(text) {
  const source = String(text || '').trim()
  if (!source) throw new Error('The selected file is empty.')
  let records
  try {
    const parsed = JSON.parse(source)
    if (parsed && typeof parsed === 'object') {
      const sample = Array.isArray(parsed) ? parsed[0] : (parsed.users && Array.isArray(parsed.users)) ? parsed.users[0] : parsed
      if (sample && (sample.userPrincipalName || sample.assignedRoles || sample.directoryRoles || (sample.userType && sample.signInActivity))) {
        records = parseEntraIdExport(parsed)
      } else if (sample && (sample.login || sample.appName || (sample.status && (sample.status === 'DEPROVISIONED' || sample.status === 'ACTIVE')) || sample.appRole)) {
        records = parseOktaExport(parsed)
      } else {
        records = Array.isArray(parsed) ? parsed : Array.isArray(parsed.grants) ? parsed.grants : [parsed]
      }
    }
  } catch {

    const lines = source.split(/\r?\n/).filter((line) => line.trim())
    if (lines.length < 2) throw new Error('Use a JSON array or CSV with a header row.')
    const headers = parseCsvLine(lines[0]).map((header, index) => boundedText(index ? header : header.replace(/^\uFEFF/, ''), 80))
    if (headers.some((header) => !header) || new Set(headers).size !== headers.length) throw new Error('CSV headers must be non-empty and unique.')
    records = lines.slice(1).map((line) => {
      const values = parseCsvLine(line)
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
    })
  }

  if (!Array.isArray(records) || !records.length) throw new Error('No access grants were found.')
  if (records.length > maxImportedGrants) throw new Error(`Imports are limited to ${maxImportedGrants} grants.`)
  if (records.some((record) => !record || typeof record !== 'object' || Array.isArray(record))) {
    throw new Error('Every grant must be a JSON object or CSV row.')
  }
  const grants = uniqueGrantIds(records.map(normalizeGrant))
  if (grants.some((grant) => grant.user === 'Unknown identity' || grant.resource === 'Unknown resource' || grant.role === 'Unspecified role')) {
    throw new Error('Every grant needs an identity, resource, and role.')
  }
  return grants
}

// Compliance Controls Tagging System
export function getComplianceControls(kind) {
  const mappings = {
    'disabled-access': [
      'SOX 404 (Access Control & Terminated User Revocation)',
      'SOC 2 CC6.3 (Revocation of Access Upon Termination)',
      'CIS Controls v8 Control 5.3 (Disable Inactive Accounts)',
      'CIS Controls v8 Control 6.2 (Revoke Access Upon Termination)'
    ],
    'sod-conflict': [
      'SOX 404 (Segregation of Duties - Request & Approve)',
      'SOC 2 CC6.1 (Authorization & Duty Segregation)',
      'CIS Controls v8 Control 6.1 (Enforce Least Privilege & SoD)'
    ],
    'dormant-access': [
      'SOX 404 (User Access Certification & Inactivity Review)',
      'SOC 2 CC6.3 (Periodic Access Re-evaluation)',
      'CIS Controls v8 Control 5.2 (Inactive Account Management)'
    ],
    'standing-privilege': [
      'SOX 404 (Administrative Privilege Control)',
      'SOC 2 CC6.1 (Logical Access & Privilege Restriction)',
      'CIS Controls v8 Control 6.8 (Centralized Privilege Management)'
    ],
    'contractor-privilege': [
      'SOX 404 (Third-Party Access Oversight)',
      'SOC 2 CC6.2 (Vendor & External User Registration)',
      'CIS Controls v8 Control 6.3 (Time-Bound Third-Party Access)'
    ],
    'missing-owner': [
      'SOX 404 (Asset Ownership & Access Authorization)',
      'SOC 2 CC6.2 (Accountable System Ownership)',
      'CIS Controls v8 Control 5.1 (Inventory of Accountable Owners)'
    ],
    'toxic-combination': [
      'SOX 404 (Cross-System Incompatible Role Conflict)',
      'SOC 2 CC6.1 (Logical Access Boundaries)',
      'CIS Controls v8 Control 6.1 (Least Privilege Enforcement)'
    ]
  }

  return mappings[kind] || ['SOX 404', 'SOC 2 CC6.1', 'CIS Controls v8 Control 6']
}

// Least-Privilege Recommendation Engine
export function calculatePrivilegeRiskScore(grant, identityGrants = []) {
  let score = 10
  const factors = []
  const roleText = `${grant.role} ${grant.permission}`.toLowerCase()

  if (['disabled', 'terminated', 'inactive'].includes(grant.accountStatus)) {
    score += 40
    factors.push('Account is disabled or terminated but holds active access (+40)')
  }

  const isPrivileged = /admin|owner|root|superuser|global/.test(roleText)
  if (isPrivileged) {
    score += 25
    factors.push('Standing administrative or root privilege (+25)')
  }

  if (grant.accountType === 'contractor' && isPrivileged) {
    score += 20
    factors.push('Contractor identity holding privileged access (+20)')
  }

  if (!grant.resourceOwner) {
    score += 10
    factors.push('Missing accountable resource owner (+10)')
  }

  const hasRequest = identityGrants.some(g => g.resource === grant.resource && /request|submit|create/i.test(g.role))
  const hasApprove = identityGrants.some(g => g.resource === grant.resource && /approv|authorize|release/i.test(g.role))
  if (hasRequest && hasApprove) {
    score += 35
    factors.push('Segregation of Duties conflict in resource (+35)')
  }

  score = Math.min(100, Math.max(0, score))

  let level = 'Low'
  if (score >= 75) level = 'Critical'
  else if (score >= 50) level = 'High'
  else if (score >= 30) level = 'Medium'

  return { score, level, factors }
}

export function recommendRoleRightSizing(grant) {
  const dept = grant.department.toLowerCase()
  const roleText = `${grant.role} ${grant.permission}`.toLowerCase()
  const isPrivileged = /admin|owner|root|superuser|global/.test(roleText)

  if (isPrivileged && ['finance', 'sales', 'people', 'support', 'hr'].includes(dept)) {
    return {
      isOverPrivileged: true,
      currentRole: grant.role,
      recommendedRole: `${grant.department} Requester / Viewer`,
      rationale: `Non-technical department (${grant.department}) identity holds elevated ${grant.role}. Right-size to business viewer role.`
    }
  }

  if (isPrivileged && grant.accountType === 'contractor') {
    return {
      isOverPrivileged: true,
      currentRole: grant.role,
      recommendedRole: 'Time-Bound Eligible Contractor Role (JIT)',
      rationale: `Contractor holds permanent ${grant.role}. Convert to Just-In-Time (JIT) eligible role with 8-hour auto-expiring window.`
    }
  }

  if (isPrivileged && grant.accessType === 'permanent') {
    return {
      isOverPrivileged: true,
      currentRole: grant.role,
      recommendedRole: 'Eligible Privilege (PIM / PAM)',
      rationale: `Standing permanent ${grant.role} privilege detected. Transition to Privileged Identity Management (PIM) approval workflow.`
    }
  }

  return {
    isOverPrivileged: false,
    currentRole: grant.role,
    recommendedRole: grant.role,
    rationale: 'Role alignment matches standard least-privilege parameters.'
  }
}

export function detectToxicCombinations(grants) {
  const findings = []
  const byUser = groupBy(grants, (g) => g.user)

  for (const [user, userGrants] of byUser) {
    const roles = userGrants.map(g => `${g.resource}:${g.role}`.toLowerCase())

    // Toxic Pair 1: Dev + Production Deployer
    const isDev = roles.some(r => r.includes('source control') || r.includes('developer'))
    const isProdDeployer = roles.some(r => r.includes('cloud console') && (r.includes('owner') || r.includes('admin')))

    if (isDev && isProdDeployer) {
      const ids = userGrants.filter(g => /source control|cloud console/i.test(g.resource)).map(g => g.id)
      findings.push(finding(
        'toxic-combination',
        'critical',
        'Toxic Combination: Code Developer & Production Release Owner',
        ids,
        `${user} holds both Source Control Admin and Production Cloud Console Owner roles across environments.`,
        'Separate development access from production release authorization. Implement mandatory dual-approval deployment pipelines.',
        { toxicPair: 'Developer + Production Deployer' }
      ))
    }
  }

  return findings
}

function finding(kind, severity, title, grantIds, summary, recommendation, extra = {}) {
  const complianceControls = getComplianceControls(kind)
  return {
    id: `${kind}:${grantIds.join('|')}`,
    kind,
    severity,
    title,
    grantIds,
    summary,
    recommendation,
    complianceControls,
    ...extra
  }
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

  // Toxic combinations cross-system check
  const toxicFindings = detectToxicCombinations(grants)
  findings.push(...toxicFindings)

  for (const [user, userGrants] of byUser) {
    if (userGrants.some((grant) => ['disabled', 'terminated', 'inactive'].includes(grant.accountStatus))) {
      findings.push(finding(
        'disabled-access',
        'critical',
        'Disabled identity retains access',
        userGrants.map((grant) => grant.id),
        `${user} still has ${userGrants.length} assignment${userGrants.length === 1 ? '' : 's'} across ${new Set(userGrants.map((grant) => grant.resource)).size} resources.`,
        'Confirm the identity lifecycle event, revoke active sessions, and remove retained grants.'
      ))
    }

    const byResource = groupBy(userGrants, (grant) => grant.resource)
    for (const [resource, resourceGrants] of byResource) {
      const roles = resourceGrants.map((grant) => grant.role.toLowerCase())
      const canRequest = roles.some((role) => /request|submit|create/.test(role))
      const canApprove = roles.some((role) => /approv|authorize|release/.test(role))
      if (canRequest && canApprove) {
        findings.push(finding(
          'sod-conflict',
          'critical',
          'Request and approval duties overlap',
          resourceGrants.map((grant) => grant.id),
          `${user} can both initiate and approve activity in ${resource}.`,
          'Separate request and approval roles or document a time-bound compensating control.'
        ))
      }
    }

    for (const grant of userGrants) {
      const riskInfo = calculatePrivilegeRiskScore(grant, userGrants)
      const rightSizing = recommendRoleRightSizing(grant)

      const inactivity = daysSince(grant.lastUsed, reviewTime)
      if (inactivity !== null && inactivity > 90) {
        const severity = inactivity > 180 ? 'high' : 'medium'
        findings.push(finding(
          'dormant-access',
          severity,
          'Dormant access assignment',
          [grant.id],
          `${grant.user} has not used ${grant.resource} for ${inactivity} days.`,
          'Confirm ongoing business need; remove the grant if it is no longer required.',
          { riskScore: riskInfo.score, rightSizingRecommendation: rightSizing }
        ))
      }

      const privileged = /admin|owner|root|superuser/.test(`${grant.role} ${grant.permission}`.toLowerCase())
      if (privileged && grant.accessType === 'permanent') {
        findings.push(finding(
          'standing-privilege',
          'high',
          'Standing privileged access',
          [grant.id],
          `${grant.user} holds permanent ${grant.role} access to ${grant.resource}.`,
          'Prefer eligible or just-in-time privilege and require a documented approval path.',
          { riskScore: riskInfo.score, rightSizingRecommendation: rightSizing }
        ))
      }

      if (privileged && grant.accountType === 'contractor') {
        findings.push(finding(
          'contractor-privilege',
          'high',
          'Contractor has privileged access',
          [grant.id],
          `${grant.user} is a contractor with ${grant.role} access to ${grant.resource}.`,
          'Validate sponsor, end date, and least-privilege scope; convert to time-bound access where possible.',
          { riskScore: riskInfo.score, rightSizingRecommendation: rightSizing }
        ))
      }

      if (!grant.resourceOwner) {
        findings.push(finding(
          'missing-owner',
          'medium',
          'Resource has no accountable owner',
          [grant.id],
          `${grant.resource} has an assignment but no resource owner in the review data.`,
          'Assign an accountable owner before certifying this access.',
          { riskScore: riskInfo.score }
        ))
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
