import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { onAuthChange, type User } from '../services/authService'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [status, setStatus] = useState<'active' | 'deactivated' | null>(null)
    const [authLoading, setAuthLoading] = useState(true)

    useEffect(() => {
        let unsubDoc: (() => void) | undefined

        const unsubscribeAuth = onAuthChange((u) => {
            setUser(u)

            if (unsubDoc) {
                unsubDoc()
                unsubDoc = undefined
            }

            if (u) {
                unsubDoc = onSnapshot(
                    doc(db, 'users', u.uid),
                    (snap) => {
                        setStatus(snap.data()?.status ?? 'active')
                        setAuthLoading(false)
                    },
                    () => {
                        // fail open on listen error, don't lock the user out unnecessarily
                        setStatus('active')
                        setAuthLoading(false)
                    }
                )
            } else {
                setStatus(null)
                setAuthLoading(false)
            }
        })

        return () => {
            unsubscribeAuth()
            if (unsubDoc) unsubDoc()
        }
    }, [])

    return { user, status, authLoading }
}