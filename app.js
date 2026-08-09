import { analyzeAccess, buildAccessMatrix, demoGrants, filterFindings, normalizeGrant, parseAccessText, reviewSummary } from './core.js'

const reviewDate = new Date('2026-08-08T12:00:00-04:00')
const storageKey = 'access-review-lab:decisions:v1'
const state = { grants: demoGrants.map(normalizeGrant), findings: [], decisions: loadDecisions(), activeFinding: null }

const ids = ['exportButton', 'addGrantButton', 'demoCueButton', 'reviewDate', 'progressText', 'progressBar', 'fileInput', 'importFileButton', 'demoButton', 'loadStatus', 'identityMetric', 'resourceMetric', 'findingMetric', 'reviewedMetric', 'findingsTab', 'matrixTab', 'grantsTab', 'findingsPanel', 'matrixPanel', 'grantsPanel', 'filterForm', 'searchInput', 'kindFilter', 'severityFilter', 'findingRows', 'findingEmpty', 'matrixTable', 'grantCount', 'grantRows', 'reviewDialog', 'dialogKind', 'dialogTitle', 'dialogSummary', 'dialogRecommendation', 'dialogGrants', 'decisionNote', 'saveDecisionButton', 'grantDialog', 'grantForm', 'closeGrantButton']
const element = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]))

function loadDecisions() { try { return JSON.parse(localStorage.getItem(storageKey)) || {} } catch { return {} } }
function persistDecisions() { try { localStorage.setItem(storageKey, JSON.stringify(state.decisions)) } catch { /* Storage is optional. */ } }

function resetReview(grants, status, clearDecisions = false) {
  if (clearDecisions) {
    state.decisions = {}
    persistDecisions()
  }
  state.grants = grants.map(normalizeGrant)
  state.findings = analyzeAccess(state.grants, reviewDate)
  populateKinds()
  renderAll()
  element.loadStatus.textContent = status
}

function renderAll() {
  const summary = reviewSummary(state.grants, state.findings, state.decisions)
  element.reviewDate.textContent = reviewDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  element.identityMetric.textContent = summary.identities
  element.resourceMetric.textContent = summary.resources
  element.findingMetric.textContent = summary.findings - summary.resolved
  element.reviewedMetric.textContent = summary.resolved
  element.progressText.textContent = `${summary.progress}%`
  element.progressBar.style.width = `${summary.progress}%`
  element.progressBar.parentElement.setAttribute('aria-valuenow', String(summary.progress))
  renderFindings()
  renderMatrix()
  renderGrants()
}

function populateKinds() {
  const current = element.kindFilter.value
  const labels = {
    'disabled-access': 'Lifecycle', 'sod-conflict': 'Separation of duties', 'dormant-access': 'Dormancy',
    'standing-privilege': 'Privileged access', 'contractor-privilege': 'Third-party access', 'missing-owner': 'Ownership',
  }
  const kinds = [...new Set(state.findings.map((finding) => finding.kind))]
  element.kindFilter.replaceChildren(new Option('All areas', ''), ...kinds.map((kind) => new Option(labels[kind] || kind, kind)))
  if (kinds.includes(current)) element.kindFilter.value = current
}

function renderFindings() {
  const findings = filterFindings(state.findings, { query: element.searchInput.value, kind: element.kindFilter.value, severity: element.severityFilter.value })
  element.findingEmpty.hidden = findings.length > 0
  element.findingRows.replaceChildren(...findings.map((finding) => {
    const row = document.createElement('tr')
    const decision = state.decisions[finding.id]?.decision || 'pending'
    row.innerHTML = '<td><div class="finding-title"><span></span><strong></strong><p></p></div></td><td><code></code></td><td><span class="grant-total"></span></td><td><button class="review-button" type="button"><span></span><i aria-hidden="true">→</i></button></td>'
    const badge = row.querySelector('.finding-title span')
    badge.className = `severity ${finding.severity}`
    badge.textContent = finding.severity
    row.querySelector('.finding-title strong').textContent = finding.title
    row.querySelector('.finding-title p').textContent = finding.summary
    row.querySelector('code').textContent = finding.kind.replaceAll('-', ' ')
    row.querySelector('.grant-total').textContent = `${finding.grantIds.length} grant${finding.grantIds.length === 1 ? '' : 's'}`
    row.querySelector('.review-button span').textContent = decision
    row.querySelector('.review-button').dataset.decision = decision
    row.querySelector('.review-button').addEventListener('click', () => openReview(finding))
    return row
  }))
}

function renderMatrix() {
  const matrix = buildAccessMatrix(state.grants)
  const head = document.createElement('thead')
  const headRow = document.createElement('tr')
  const corner = document.createElement('th'); corner.textContent = 'Identity'; headRow.append(corner)
  matrix.resources.forEach((resource) => { const th = document.createElement('th'); th.textContent = resource; headRow.append(th) })
  head.append(headRow)
  const body = document.createElement('tbody')
  matrix.users.forEach((user) => {
    const row = document.createElement('tr')
    const userCell = document.createElement('th'); userCell.scope = 'row'; userCell.textContent = user; row.append(userCell)
    matrix.resources.forEach((resource) => {
      const grants = matrix.cells.get(`${user}\u0000${resource}`) || []
      const cell = document.createElement('td')
      if (grants.length) {
        const privileged = grants.some((grant) => /admin|owner|root/.test(`${grant.role} ${grant.permission}`.toLowerCase()))
        if (privileged) cell.classList.add('privileged-cell')
        grants.forEach((grant) => { const span = document.createElement('span'); span.textContent = grant.role; cell.append(span) })
      } else cell.textContent = '—'
      row.append(cell)
    })
    body.append(row)
  })
  element.matrixTable.replaceChildren(head, body)
}

function renderGrants() {
  element.grantCount.textContent = `${state.grants.length} assignments`
  element.grantRows.replaceChildren(...state.grants.map((grant) => {
    const row = document.createElement('tr')
    row.innerHTML = '<td><strong></strong><small></small></td><td></td><td><span class="role-pill"></span></td><td><time></time></td><td></td>'
    row.querySelector('strong').textContent = grant.user
    row.querySelector('small').textContent = `${grant.department} · ${grant.accountStatus}`
    row.children[1].textContent = grant.resource
    row.querySelector('.role-pill').textContent = grant.role
    const time = row.querySelector('time'); time.dateTime = grant.lastUsed; time.textContent = grant.lastUsed || 'Not recorded'
    row.children[4].textContent = grant.resourceOwner || 'Missing'
    return row
  }))
}

function openReview(finding) {
  state.activeFinding = finding
  const saved = state.decisions[finding.id] || { decision: 'pending', note: '' }
  element.dialogKind.textContent = `${finding.severity} severity / ${finding.kind.replaceAll('-', ' ')}`
  element.dialogTitle.textContent = finding.title
  element.dialogSummary.textContent = finding.summary
  element.dialogRecommendation.textContent = finding.recommendation
  element.decisionNote.value = saved.note || ''
  const radio = element.reviewDialog.querySelector(`input[name="decision"][value="${saved.decision}"]`)
  if (radio) radio.checked = true
  element.dialogGrants.replaceChildren(...finding.grantIds.map((id) => {
    const grant = state.grants.find((candidate) => candidate.id === id)
    const card = document.createElement('div')
    if (grant) {
      const title = document.createElement('strong'); title.textContent = `${grant.user} → ${grant.resource}`
      const details = document.createElement('p'); details.textContent = `${grant.role} · ${grant.accessType} · last used ${grant.lastUsed || 'not recorded'}`
      card.append(title, details)
    }
    return card
  }))
  element.reviewDialog.showModal()
}

function saveReview() {
  if (!state.activeFinding) return
  const selected = element.reviewDialog.querySelector('input[name="decision"]:checked')
  state.decisions[state.activeFinding.id] = { decision: selected?.value || 'pending', note: element.decisionNote.value.trim(), reviewedAt: new Date().toISOString() }
  persistDecisions()
  renderAll()
}

function showPanel(tab) {
  const tabs = [element.findingsTab, element.matrixTab, element.grantsTab]
  const panels = [element.findingsPanel, element.matrixPanel, element.grantsPanel]
  const index = tabs.indexOf(tab)
  tabs.forEach((item, itemIndex) => { item.setAttribute('aria-selected', String(itemIndex === index)); item.tabIndex = itemIndex === index ? 0 : -1 })
  panels.forEach((panel, itemIndex) => { panel.hidden = itemIndex !== index })
}

function downloadReview() {
  const payload = { reviewDate: reviewDate.toISOString(), exportedAt: new Date().toISOString(), summary: reviewSummary(state.grants, state.findings, state.decisions), findings: state.findings.map((finding) => ({ ...finding, review: state.decisions[finding.id] || { decision: 'pending', note: '' } })), grants: state.grants }
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a'); link.href = url; link.download = 'access-review.json'; link.click(); URL.revokeObjectURL(url)
}

[element.findingsTab, element.matrixTab, element.grantsTab].forEach((tab, index, tabs) => {
  tab.addEventListener('click', () => showPanel(tab))
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    const offset = event.key === 'ArrowRight' ? 1 : -1
    const target = tabs[(index + offset + tabs.length) % tabs.length]
    showPanel(target); target.focus()
  })
})
element.filterForm.addEventListener('input', renderFindings)
element.demoButton.addEventListener('click', () => resetReview(demoGrants, 'Sample directory and review decisions reset.', true))
element.demoCueButton.addEventListener('click', () => {
  const finding = state.findings.find((item) => item.kind === 'sod-conflict')
  if (finding) openReview(finding)
})
element.exportButton.addEventListener('click', downloadReview)
element.saveDecisionButton.addEventListener('click', saveReview)
element.addGrantButton.addEventListener('click', () => { element.grantForm.reset(); element.grantForm.elements.lastUsed.value = '2026-08-08'; element.grantDialog.showModal() })
element.closeGrantButton.addEventListener('click', () => element.grantDialog.close())
element.grantForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const grant = Object.fromEntries(new FormData(element.grantForm))
  grant.id = `custom-${crypto.randomUUID()}`
  state.grants.push(normalizeGrant(grant, state.grants.length))
  state.findings = analyzeAccess(state.grants, reviewDate)
  populateKinds(); renderAll(); element.grantDialog.close(); element.loadStatus.textContent = `${grant.user} → ${grant.resource} added to this browser session.`
})
element.importFileButton.addEventListener('click', () => element.fileInput.click())
element.fileInput.addEventListener('change', async () => {
  const file = element.fileInput.files?.[0]
  if (!file) return
  if (file.size > 3 * 1024 * 1024) { element.loadStatus.textContent = 'Choose a file smaller than 3 MB.'; return }
  try { const grants = parseAccessText(await file.text()); resetReview(grants, `${grants.length} grants loaded from ${file.name}.`, true) } catch (error) { element.loadStatus.textContent = error.message } finally { element.fileInput.value = '' }
})

resetReview(demoGrants, 'Sample directory loaded.')
