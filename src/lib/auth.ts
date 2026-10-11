// Login com Supabase: o adulto entra com o e-mail e um código de 6 dígitos (sem senha).
// Código em vez de link mágico: no iPhone o app instalado na Tela de Início não recebe a sessão
// aberta pelo link (que abre no Safari); o código é digitado no próprio app.
//
// Sem VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (ex.: em desenvolvimento e nos testes),
// o login fica desligado e o app abre direto.

import { useEffect, useState } from 'react'
import { createClient, type Session } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const authEnabled = Boolean(url && key)

export const supabase = authEnabled
  ? createClient(url!, key!, {
      auth: { storageKey: 'fala-falinha:auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null

/** Sessão atual; `undefined` enquanto carrega (lida do armazenamento local, funciona offline). */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null)
  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  return session
}

/** Envia o código por e-mail. Cria a conta na primeira vez (é o "cadastro"). */
export async function sendCode(email: string): Promise<void> {
  const { error } = await supabase!.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) throw error
}

export async function verifyCode(email: string, token: string): Promise<void> {
  const { error } = await supabase!.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}

/**
 * Apaga a conta do próprio usuário (direito de exclusão, LGPD). Usa a função `delete_my_account`
 * criada no banco do Supabase (SQL no README, seção "Login"); a chave pública não apaga usuários sozinha.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase!.rpc('delete_my_account')
  if (error) throw error
  await supabase!.auth.signOut()
}
