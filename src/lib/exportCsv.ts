import type { CollectedMoney, Expense, Project } from '../types'

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function formatInr(amount: number): string {
  return amount.toFixed(2)
}

type ExportRow = {
  type: 'Expense' | 'Collected'
  date: string
  description: string
  amount: number
  category: string
  vendorOrFrom: string
  paymentOrNotes: string
  notes: string
  receiptUrl: string
}

function expenseRows(expenses: Expense[]): ExportRow[] {
  return expenses.map((e) => ({
    type: 'Expense',
    date: e.recordedAt,
    description: e.title,
    amount: e.amount,
    category: e.category ?? '',
    vendorOrFrom: e.vendor ?? '',
    paymentOrNotes: e.paymentMethod?.replace('_', ' ') ?? '',
    notes: e.notes ?? '',
    receiptUrl: e.receiptImageUrl ?? '',
  }))
}

function collectedRows(items: CollectedMoney[]): ExportRow[] {
  return items.map((c) => ({
    type: 'Collected',
    date: c.recordedAt,
    description: c.title,
    amount: c.amount,
    category: '',
    vendorOrFrom: c.receivedFrom ?? '',
    paymentOrNotes: '',
    notes: c.notes ?? '',
    receiptUrl: '',
  }))
}

function buildCsv(rows: ExportRow[], projectName: string): string {
  const header = [
    'Project',
    'Type',
    'Date',
    'Description',
    'Amount (INR)',
    'Category',
    'Vendor / Received from',
    'Payment method',
    'Notes',
    'Receipt URL',
  ]
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        escapeCsv(projectName),
        r.type,
        r.date,
        escapeCsv(r.description),
        formatInr(r.amount),
        escapeCsv(r.category),
        escapeCsv(r.vendorOrFrom),
        escapeCsv(r.paymentOrNotes),
        escapeCsv(r.notes),
        escapeCsv(r.receiptUrl),
      ].join(','),
    ),
  ]

  const expenseTotal = rows.filter((r) => r.type === 'Expense').reduce((s, r) => s + r.amount, 0)
  const collectedTotal = rows.filter((r) => r.type === 'Collected').reduce((s, r) => s + r.amount, 0)
  lines.push('')
  lines.push(`Summary,,,,,,,,`)
  lines.push(`Total expenses,,,,${formatInr(expenseTotal)},,,,,`)
  lines.push(`Total collected,,,,${formatInr(collectedTotal)},,,,,`)

  return lines.join('\n')
}

function triggerDownload(filename: string, content: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadProjectCsv(
  project: Project,
  expenses: Expense[],
  collections: CollectedMoney[],
) {
  const rows = [
    ...expenseRows(expenses),
    ...collectedRows(collections),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type))

  const safeName = project.name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'project'
  const csv = buildCsv(rows, project.name)
  triggerDownload(`${safeName}-expenses-${new Date().toISOString().slice(0, 10)}.csv`, csv)
}

export function downloadAllProjectsCsv(
  projects: Project[],
  expenses: Expense[],
  collections: CollectedMoney[],
) {
  const rows: ExportRow[] = []
  for (const p of projects) {
    const projExpenses = expenses.filter((e) => e.projectId === p.id)
    const projCollections = collections.filter((c) => c.projectId === p.id)
    for (const r of expenseRows(projExpenses)) {
      rows.push({ ...r, description: `[${p.name}] ${r.description}` })
    }
    for (const r of collectedRows(projCollections)) {
      rows.push({ ...r, description: `[${p.name}] ${r.description}` })
    }
  }
  rows.sort((a, b) => a.date.localeCompare(b.date))

  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const collectedTotal = collections.reduce((s, c) => s + c.amount, 0)

  const header = [
    'Type',
    'Date',
    'Description',
    'Amount (INR)',
    'Category',
    'Vendor / Received from',
    'Payment method',
    'Notes',
    'Receipt URL',
  ]
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.type,
        r.date,
        escapeCsv(r.description),
        formatInr(r.amount),
        escapeCsv(r.category),
        escapeCsv(r.vendorOrFrom),
        escapeCsv(r.paymentOrNotes),
        escapeCsv(r.notes),
        escapeCsv(r.receiptUrl),
      ].join(','),
    ),
    '',
    `Total expenses,,,${formatInr(expenseTotal)},,,,`,
    `Total collected,,,${formatInr(collectedTotal)},,,,`,
  ]

  triggerDownload(`all-expenses-${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n'))
}
