export type UserRole = 'admin' | 'member'

export type ProjectStatus = 'ongoing' | 'completed'

export type Project = {
  id: string
  name: string
  status: ProjectStatus
  summary?: string
}

export type PaymentMethod = 'card' | 'cash' | 'bank_transfer' | 'other'

export type TeamProfile = {
  id: string
  email: string
  displayName: string
  role: UserRole
  createdAt?: string
}

export type Expense = {
  id: string
  projectId: string
  title: string
  amount: number
  recordedAt: string
  category?: string
  vendor?: string
  paymentMethod?: PaymentMethod
  notes?: string
  receiptImageUrl?: string
  receiptStoragePath?: string
}

export type AddExpenseInput = {
  projectId: string
  title: string
  amount: number
  recordedAt: string
  category?: string
  vendor?: string
  paymentMethod?: PaymentMethod
  notes?: string
  receiptFile?: File | null
}

export type CollectedMoney = {
  id: string
  projectId: string
  title: string
  amount: number
  recordedAt: string
  receivedFrom?: string
  notes?: string
}

export type AddCollectedMoneyInput = {
  projectId: string
  title: string
  amount: number
  recordedAt: string
  receivedFrom?: string
  notes?: string
}
