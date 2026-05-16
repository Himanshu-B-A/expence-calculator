import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useExpenseApp } from '../context/ExpenseAppContext'
import { Button, Card, TextInput } from '../components/Ui'
import type { PaymentMethod } from '../types'

const CATEGORIES = [
  'Software & subscriptions',
  'Travel',
  'Meals & entertainment',
  'Office & supplies',
  'Contractors',
  'Marketing',
  'Equipment',
  'Other',
]

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
]

export function EditExpensePage() {
  const { projectId, expenseId } = useParams<{ projectId: string; expenseId: string }>()
  const { projectById, expenseById, updateExpense, isAdmin } = useExpenseApp()
  const navigate = useNavigate()
  const project = projectId ? projectById(projectId) : undefined
  const expense = expenseId ? expenseById(expenseId) : undefined

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [recordedAt, setRecordedAt] = useState('')
  const [category, setCategory] = useState('')
  const [vendor, setVendor] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [notes, setNotes] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [removeReceipt, setRemoveReceipt] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!expense || loaded) return
    setTitle(expense.title)
    setAmount(String(expense.amount))
    setRecordedAt(expense.recordedAt)
    setCategory(expense.category ?? '')
    setVendor(expense.vendor ?? '')
    setPaymentMethod(expense.paymentMethod ?? 'card')
    setNotes(expense.notes ?? '')
    setReceiptPreview(expense.receiptImageUrl ?? null)
    setLoaded(true)
  }, [expense, loaded])

  if (!isAdmin) {
    return <Navigate to="/app/projects" replace />
  }

  if (!projectId || !project || !expenseId || !expense || expense.projectId !== projectId) {
    return <Navigate to={`/app/projects/${projectId ?? ''}`} replace />
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setReceiptPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
    if (!file) {
      setReceiptFile(null)
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Receipt must be an image (PNG, JPG, WebP, etc.).')
      setReceiptFile(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.')
      setReceiptFile(null)
      return
    }
    setError(null)
    setRemoveReceipt(false)
    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const n = Number.parseFloat(amount)
    if (!title.trim() || Number.isNaN(n) || n <= 0) return
    setSaving(true)
    try {
      await updateExpense(expense.id, {
        title: title.trim(),
        amount: n,
        recordedAt,
        category: category || undefined,
        vendor: vendor.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
        receiptFile,
        removeReceipt,
      })
      navigate(`/app/projects/${project.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update expense.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-left">
        <Link
          to={`/app/projects/${project.id}`}
          className="text-sm font-medium text-cyan-300/90 hover:text-cyan-200"
        >
          ← Back to project
        </Link>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Edit expense</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {project.name} · <span className="text-violet-300/90">Admin only</span>
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {error && (
            <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <TextInput
            label="Description / what was purchased"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Amount (INR)"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <TextInput
              label="Date"
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              required
            />
          </div>
          <label className="block" htmlFor="edit-category">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Category
            </span>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <TextInput label="Vendor (optional)" value={vendor} onChange={(e) => setVendor(e.target.value)} />
          <label className="block" htmlFor="edit-payment">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Payment method
            </span>
            <select
              id="edit-payment"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {PAYMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block" htmlFor="edit-notes">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Notes (optional)
            </span>
            <textarea
              id="edit-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Receipt image
            </span>
            {expense.receiptImageUrl && !removeReceipt && !receiptFile && (
              <div className="mb-3 overflow-hidden rounded-xl border border-zinc-800">
                <img
                  src={expense.receiptImageUrl}
                  alt="Current receipt"
                  className="max-h-48 w-full object-contain bg-zinc-950"
                />
                <button
                  type="button"
                  onClick={() => {
                    setRemoveReceipt(true)
                    setReceiptPreview(null)
                  }}
                  className="w-full border-t border-zinc-800 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10"
                >
                  Remove receipt
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="block w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-cyan-200 hover:file:bg-zinc-700"
            />
            {receiptPreview && receiptPreview !== expense.receiptImageUrl && (
              <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">
                <img
                  src={receiptPreview}
                  alt="New receipt preview"
                  className="max-h-48 w-full object-contain bg-zinc-950"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
