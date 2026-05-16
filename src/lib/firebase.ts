import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const SECONDARY_NAME = 'Secondary'

function readConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  }
}

export function isFirebaseConfigured(): boolean {
  const c = readConfig()
  return Boolean(c.apiKey.trim() && c.projectId.trim())
}

export type FirebaseBundle = {
  app: FirebaseApp
  auth: Auth
  secondaryAuth: Auth
  db: Firestore
  storage: FirebaseStorage
}

let bundle: FirebaseBundle | null = null

export function getFirebase(): FirebaseBundle | null {
  if (!isFirebaseConfigured()) return null
  if (bundle) return bundle

  const config = readConfig()
  const app = getApps().find((a) => a.name === '[DEFAULT]') ?? initializeApp(config)
  const secondaryApp =
    getApps().find((a) => a.name === SECONDARY_NAME) ?? initializeApp(config, SECONDARY_NAME)

  bundle = {
    app,
    auth: getAuth(app),
    secondaryAuth: getAuth(secondaryApp),
    db: getFirestore(app),
    storage: getStorage(app),
  }
  return bundle
}

export function adminEmailList(): string[] {
  const raw = import.meta.env.VITE_EXPENSE_ADMIN_EMAILS || ''
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmailList().includes(email.trim().toLowerCase())
}
