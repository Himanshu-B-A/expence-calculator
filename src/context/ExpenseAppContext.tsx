import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { adminEmailList, getFirebase, isAdminEmail, isFirebaseConfigured } from '../lib/firebase'
import type {
  AddCollectedMoneyInput,
  AddExpenseInput,
  CollectedMoney,
  Expense,
  Project,
  ProjectStatus,
  TeamProfile,
  UpdateCollectedMoneyInput,
  UpdateExpenseInput,
  UserRole,
} from '../types'

type ExpenseAppValue = {
  firebaseConfigured: boolean
  authReady: boolean
  isAuthenticated: boolean
  role: UserRole
  isAdmin: boolean
  projects: Project[]
  expenses: Expense[]
  collections: CollectedMoney[]
  teamMembers: TeamProfile[]
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  addProject: (name: string, summary?: string) => Promise<void>
  addPerson: (input: {
    displayName: string
    email: string
    password: string
  }) => Promise<{ ok: boolean; error?: string }>
  addExpense: (input: AddExpenseInput) => Promise<void>
  updateExpense: (expenseId: string, input: UpdateExpenseInput) => Promise<void>
  deleteExpense: (expenseId: string) => Promise<void>
  addCollectedMoney: (input: AddCollectedMoneyInput) => Promise<void>
  updateCollectedMoney: (collectionId: string, input: UpdateCollectedMoneyInput) => Promise<void>
  deleteCollectedMoney: (collectionId: string) => Promise<void>
  projectById: (id: string) => Project | undefined
  expenseById: (id: string) => Expense | undefined
  collectionById: (id: string) => CollectedMoney | undefined
  expensesForProject: (projectId: string) => Expense[]
  collectionsForProject: (projectId: string) => CollectedMoney[]
  memberNameById: (uid?: string) => string
  completeProject: (projectId: string) => Promise<void>
  reopenProject: (projectId: string) => Promise<void>
  updateProject: (projectId: string, name: string, summary?: string) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
}

const ExpenseAppContext = createContext<ExpenseAppValue | null>(null)

function mapProject(d: QueryDocumentSnapshot<DocumentData>): Project {
  const data = d.data()
  return {
    id: d.id,
    name: String(data.name ?? ''),
    status: (data.status as ProjectStatus) === 'completed' ? 'completed' : 'ongoing',
    summary: data.summary ? String(data.summary) : undefined,
  }
}

function mapExpense(d: QueryDocumentSnapshot<DocumentData>): Expense {
  const data = d.data()
  const amount = typeof data.amount === 'number' ? data.amount : Number(data.amount)
  return {
    id: d.id,
    projectId: String(data.projectId ?? ''),
    title: String(data.title ?? ''),
    amount: Number.isFinite(amount) ? amount : 0,
    recordedAt: String(data.recordedAt ?? ''),
    category: data.category ? String(data.category) : undefined,
    vendor: data.vendor ? String(data.vendor) : undefined,
    paymentMethod: data.paymentMethod as Expense['paymentMethod'],
    notes: data.notes ? String(data.notes) : undefined,
    receiptImageUrl: data.receiptImageUrl ? String(data.receiptImageUrl) : undefined,
    receiptStoragePath: data.receiptStoragePath ? String(data.receiptStoragePath) : undefined,
    createdBy: data.createdBy ? String(data.createdBy) : undefined,
  }
}

function mapCollection(d: QueryDocumentSnapshot<DocumentData>): CollectedMoney {
  const data = d.data()
  const amount = typeof data.amount === 'number' ? data.amount : Number(data.amount)
  return {
    id: d.id,
    projectId: String(data.projectId ?? ''),
    title: String(data.title ?? ''),
    amount: Number.isFinite(amount) ? amount : 0,
    recordedAt: String(data.recordedAt ?? ''),
    receivedFrom: data.receivedFrom ? String(data.receivedFrom) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
    createdBy: data.createdBy ? String(data.createdBy) : undefined,
  }
}

function mapProfile(d: QueryDocumentSnapshot<DocumentData>): TeamProfile {
  const data = d.data()
  const created = data.createdAt as { toDate?: () => Date } | undefined
  const createdAt =
    created && typeof created.toDate === 'function'
      ? created.toDate().toISOString().slice(0, 10)
      : undefined
  return {
    id: d.id,
    email: String(data.email ?? '').toLowerCase(),
    displayName: String(data.displayName ?? ''),
    role: data.role === 'admin' ? 'admin' : 'member',
    createdAt,
  }
}

export function ExpenseAppProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(() => !isFirebaseConfigured())
  const [userUid, setUserUid] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole>('member')
  const [projects, setProjects] = useState<Project[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [collections, setCollections] = useState<CollectedMoney[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamProfile[]>([])

  const firebaseConfigured = isFirebaseConfigured()

  useEffect(() => {
    const fb = getFirebase()
    if (!fb) {
      return
    }

    const unsubAuth = onAuthStateChanged(fb.auth, async (user) => {
      if (!user) {
        setUserUid(null)
        setRole('member')
        setProjects([])
        setExpenses([])
        setCollections([])
        setTeamMembers([])
        setAuthReady(true)
        return
      }

      setUserUid(user.uid)

      const profileRef = doc(fb.db, 'profiles', user.uid)
      const snap = await getDoc(profileRef)
      const displayName =
        user.displayName?.trim() || user.email?.split('@')[0]?.trim() || 'User'
      const emailLower = user.email?.toLowerCase() ?? ''
      const shouldAdmin = isAdminEmail(user.email)

      if (!snap.exists()) {
        const initialRole: UserRole = shouldAdmin ? 'admin' : 'member'
        await setDoc(profileRef, {
          email: emailLower,
          displayName,
          role: initialRole,
          createdAt: serverTimestamp(),
        })
        setRole(initialRole)
      } else {
        const data = snap.data()
        let nextRole: UserRole = data.role === 'admin' ? 'admin' : 'member'
        if (shouldAdmin && nextRole !== 'admin') {
          await updateDoc(profileRef, { role: 'admin' })
          nextRole = 'admin'
        }
        setRole(nextRole)
      }

      setAuthReady(true)
    })

    return () => unsubAuth()
  }, [])

  useEffect(() => {
    const fb = getFirebase()
    if (!fb || !userUid) return

    const unsubs: Array<() => void> = []

    unsubs.push(
      onSnapshot(collection(fb.db, 'projects'), (snap) => {
        setProjects(snap.docs.map(mapProject))
      }),
    )

    unsubs.push(
      onSnapshot(collection(fb.db, 'expenses'), (snap) => {
        setExpenses(snap.docs.map(mapExpense))
      }),
    )

    unsubs.push(
      onSnapshot(collection(fb.db, 'collections'), (snap) => {
        setCollections(snap.docs.map(mapCollection))
      }),
    )

    unsubs.push(
      onSnapshot(collection(fb.db, 'profiles'), (snap) => {
        setTeamMembers(snap.docs.map(mapProfile))
      }),
    )

    return () => unsubs.forEach((u) => u())
  }, [userUid])

  const login = useCallback(async (email: string, password: string) => {
    const fb = getFirebase()
    if (!fb) {
      throw new Error(
        'Firebase is not configured. Add VITE_FIREBASE_* variables (see .env.example).',
      )
    }
    await signInWithEmailAndPassword(fb.auth, email.trim(), password)
  }, [])

  const logout = useCallback(async () => {
    const fb = getFirebase()
    if (fb) await signOut(fb.auth)
  }, [])

  const addProject = useCallback(
    async (name: string, summary?: string) => {
      const fb = getFirebase()
      if (!fb || role !== 'admin') return
      await addDoc(collection(fb.db, 'projects'), {
        name: name.trim(),
        status: 'ongoing',
        summary: summary?.trim() || null,
        createdAt: serverTimestamp(),
      })
    },
    [role],
  )

  const addPerson = useCallback(
    async (input: { displayName: string; email: string; password: string }) => {
      const fb = getFirebase()
      if (!fb || role !== 'admin') return { ok: false, error: 'Only admins can add team members.' }
      const email = input.email.trim().toLowerCase()
      const displayName = input.displayName.trim()
      if (!email || !displayName || !input.password) {
        return { ok: false, error: 'Name, email, and password are required.' }
      }
      if (adminEmailList().includes(email)) {
        return { ok: false, error: 'This email is reserved for an administrator account.' }
      }

      try {
        const cred = await createUserWithEmailAndPassword(fb.secondaryAuth, email, input.password)
        await setDoc(doc(fb.db, 'profiles', cred.user.uid), {
          email,
          displayName,
          role: 'member',
          createdAt: serverTimestamp(),
        })
        return { ok: true as const }
      } catch (e: unknown) {
        const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : ''
        const msg =
          code === 'auth/email-already-in-use'
            ? 'That email already has an account.'
            : e instanceof Error
              ? e.message
              : 'Could not create account.'
        return { ok: false as const, error: msg }
      } finally {
        await signOut(fb.secondaryAuth).catch(() => {})
      }
    },
    [role],
  )

  const addExpense = useCallback(async (input: AddExpenseInput) => {
    const fb = getFirebase()
    if (!fb || !fb.auth.currentUser) return

    const expenseRef = doc(collection(fb.db, 'expenses'))
    const expenseId = expenseRef.id

    let receiptImageUrl: string | undefined
    let receiptStoragePath: string | undefined

    if (input.receiptFile && input.receiptFile.size > 0) {
      const safeName = input.receiptFile.name.replace(/[^\w.-]/g, '_') || 'receipt'
      const path = `receipts/${input.projectId}/${expenseId}/${safeName}`
      const ref = storageRef(fb.storage, path)
      await uploadBytes(ref, input.receiptFile)
      receiptImageUrl = await getDownloadURL(ref)
      receiptStoragePath = path
    }

    await setDoc(expenseRef, {
      projectId: input.projectId,
      title: input.title.trim(),
      amount: Math.round(input.amount * 100) / 100,
      recordedAt: input.recordedAt,
      category: input.category?.trim() || null,
      vendor: input.vendor?.trim() || null,
      paymentMethod: input.paymentMethod ?? null,
      notes: input.notes?.trim() || null,
      receiptImageUrl: receiptImageUrl ?? null,
      receiptStoragePath: receiptStoragePath ?? null,
      createdBy: fb.auth.currentUser.uid,
      createdAt: serverTimestamp(),
    })
  }, [])

  const addCollectedMoney = useCallback(async (input: AddCollectedMoneyInput) => {
    const fb = getFirebase()
    if (!fb || !fb.auth.currentUser) return

    await addDoc(collection(fb.db, 'collections'), {
      projectId: input.projectId,
      title: input.title.trim(),
      amount: Math.round(input.amount * 100) / 100,
      recordedAt: input.recordedAt,
      receivedFrom: input.receivedFrom?.trim() || null,
      notes: input.notes?.trim() || null,
      createdBy: fb.auth.currentUser.uid,
      createdAt: serverTimestamp(),
    })
  }, [])

  const requireAdmin = useCallback(() => {
    if (role !== 'admin') {
      throw new Error('Only administrators can perform this action.')
    }
  }, [role])

  const uploadReceipt = useCallback(
    async (projectId: string, expenseId: string, file: File) => {
      const fb = getFirebase()
      if (!fb) throw new Error('Firebase is not configured.')
      const safeName = file.name.replace(/[^\w.-]/g, '_') || 'receipt'
      const path = `receipts/${projectId}/${expenseId}/${safeName}`
      const ref = storageRef(fb.storage, path)
      await uploadBytes(ref, file)
      const receiptImageUrl = await getDownloadURL(ref)
      return { receiptImageUrl, receiptStoragePath: path }
    },
    [],
  )

  const removeReceiptFile = useCallback(async (storagePath?: string) => {
    if (!storagePath) return
    const fb = getFirebase()
    if (!fb) return
    await deleteObject(storageRef(fb.storage, storagePath)).catch(() => {})
  }, [])

  const updateExpense = useCallback(
    async (expenseId: string, input: UpdateExpenseInput) => {
      const fb = getFirebase()
      if (!fb) return
      requireAdmin()

      const existing = expenses.find((e) => e.id === expenseId)
      if (!existing) throw new Error('Expense not found.')

      let receiptImageUrl = existing.receiptImageUrl ?? null
      let receiptStoragePath = existing.receiptStoragePath ?? null

      if (input.removeReceipt && existing.receiptStoragePath) {
        await removeReceiptFile(existing.receiptStoragePath)
        receiptImageUrl = null
        receiptStoragePath = null
      }

      if (input.receiptFile && input.receiptFile.size > 0) {
        if (existing.receiptStoragePath) {
          await removeReceiptFile(existing.receiptStoragePath)
        }
        const uploaded = await uploadReceipt(existing.projectId, expenseId, input.receiptFile)
        receiptImageUrl = uploaded.receiptImageUrl
        receiptStoragePath = uploaded.receiptStoragePath
      }

      await updateDoc(doc(fb.db, 'expenses', expenseId), {
        title: input.title.trim(),
        amount: Math.round(input.amount * 100) / 100,
        recordedAt: input.recordedAt,
        category: input.category?.trim() || null,
        vendor: input.vendor?.trim() || null,
        paymentMethod: input.paymentMethod ?? null,
        notes: input.notes?.trim() || null,
        receiptImageUrl,
        receiptStoragePath,
      })
    },
    [requireAdmin, expenses, uploadReceipt, removeReceiptFile],
  )

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      const fb = getFirebase()
      if (!fb) return
      requireAdmin()

      const existing = expenses.find((e) => e.id === expenseId)
      if (!existing) throw new Error('Expense not found.')

      await removeReceiptFile(existing.receiptStoragePath)
      await deleteDoc(doc(fb.db, 'expenses', expenseId))
    },
    [requireAdmin, expenses, removeReceiptFile],
  )

  const updateCollectedMoney = useCallback(
    async (collectionId: string, input: UpdateCollectedMoneyInput) => {
      const fb = getFirebase()
      if (!fb) return
      requireAdmin()

      await updateDoc(doc(fb.db, 'collections', collectionId), {
        title: input.title.trim(),
        amount: Math.round(input.amount * 100) / 100,
        recordedAt: input.recordedAt,
        receivedFrom: input.receivedFrom?.trim() || null,
        notes: input.notes?.trim() || null,
      })
    },
    [requireAdmin],
  )

  const deleteCollectedMoney = useCallback(
    async (collectionId: string) => {
      const fb = getFirebase()
      if (!fb) return
      requireAdmin()
      await deleteDoc(doc(fb.db, 'collections', collectionId))
    },
    [requireAdmin],
  )

  const completeProject = useCallback(
    async (projectId: string) => {
      const fb = getFirebase()
      if (!fb) return
      requireAdmin()
      await updateDoc(doc(fb.db, 'projects', projectId), {
        status: 'completed',
      })
    },
    [requireAdmin],
  )

  const reopenProject = useCallback(
    async (projectId: string) => {
      const fb = getFirebase()
      if (!fb) return
      requireAdmin()
      await updateDoc(doc(fb.db, 'projects', projectId), {
        status: 'ongoing',
      })
    },
    [requireAdmin],
  )

  const updateProject = useCallback(
    async (projectId: string, name: string, summary?: string) => {
      const fb = getFirebase()
      if (!fb) return
      requireAdmin()
      const trimmed = name.trim()
      if (!trimmed) throw new Error('Project name is required.')
      await updateDoc(doc(fb.db, 'projects', projectId), {
        name: trimmed,
        summary: summary?.trim() || null,
      })
    },
    [requireAdmin],
  )

  const deleteProject = useCallback(
    async (projectId: string) => {
      const fb = getFirebase()
      if (!fb) return
      requireAdmin()

      const projectExpenses = expenses.filter((e) => e.projectId === projectId)
      const projectCollections = collections.filter((c) => c.projectId === projectId)

      for (const e of projectExpenses) {
        await removeReceiptFile(e.receiptStoragePath)
      }

      const batch = writeBatch(fb.db)
      for (const e of projectExpenses) {
        batch.delete(doc(fb.db, 'expenses', e.id))
      }
      for (const c of projectCollections) {
        batch.delete(doc(fb.db, 'collections', c.id))
      }
      batch.delete(doc(fb.db, 'projects', projectId))
      await batch.commit()
    },
    [requireAdmin, expenses, collections, removeReceiptFile],
  )

  const projectById = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  )

  const expenseById = useCallback((id: string) => expenses.find((e) => e.id === id), [expenses])

  const collectionById = useCallback(
    (id: string) => collections.find((c) => c.id === id),
    [collections],
  )

  const expensesForProject = useCallback(
    (projectId: string) => expenses.filter((e) => e.projectId === projectId),
    [expenses],
  )

  const collectionsForProject = useCallback(
    (projectId: string) => collections.filter((c) => c.projectId === projectId),
    [collections],
  )

  const memberNameById = useCallback(
    (uid?: string) => {
      if (!uid) return 'Unknown'
      const member = teamMembers.find((m) => m.id === uid)
      return member?.displayName ?? 'Unknown'
    },
    [teamMembers],
  )

  const isAuthenticated = userUid !== null

  const value = useMemo<ExpenseAppValue>(
    () => ({
      firebaseConfigured,
      authReady,
      isAuthenticated,
      role,
      isAdmin: role === 'admin',
      projects,
      expenses,
      collections,
      teamMembers,
      login,
      logout,
      addProject,
      addPerson,
      addExpense,
      updateExpense,
      deleteExpense,
      addCollectedMoney,
      updateCollectedMoney,
      deleteCollectedMoney,
      projectById,
      expenseById,
      collectionById,
      expensesForProject,
      collectionsForProject,
      memberNameById,
      completeProject,
      reopenProject,
      updateProject,
      deleteProject,
    }),
    [
      firebaseConfigured,
      authReady,
      isAuthenticated,
      role,
      projects,
      expenses,
      collections,
      teamMembers,
      login,
      logout,
      addProject,
      addPerson,
      addExpense,
      updateExpense,
      deleteExpense,
      addCollectedMoney,
      updateCollectedMoney,
      deleteCollectedMoney,
      projectById,
      expenseById,
      collectionById,
      expensesForProject,
      collectionsForProject,
      memberNameById,
      completeProject,
      reopenProject,
      updateProject,
      deleteProject,
    ],
  )

  return <ExpenseAppContext.Provider value={value}>{children}</ExpenseAppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is tied to ExpenseAppProvider
export function useExpenseApp() {
  const ctx = useContext(ExpenseAppContext)
  if (!ctx) throw new Error('useExpenseApp must be used within ExpenseAppProvider')
  return ctx
}
