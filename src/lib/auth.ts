// Login com Supabase: o adulto entra com e-mail e senha. Criar a conta não manda e-mail
// ("Confirm email" desligado no painel), então funciona igual no app instalado no iPhone.
// O único e-mail é o de "esqueci a senha": o link abre o site, que pede a senha nova.
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

// O link de "esqueci a senha" volta como https://falafalinha.com/#access_token=…&type=recovery
// (ou #error=…&error_code=otp_expired). Isso brigaria com o HashRouter, então é lido e limpo
// aqui, antes do app desenhar a primeira tela.
const linkParams = /(^|[#&])(access_token|error_code)=/.test(location.hash)
  ? new URLSearchParams(location.hash.slice(1))
  : null
if (linkParams) history.replaceState(null, '', `${location.pathname}${location.search}#/`)

/** Veio do link de "esqueci a senha": a tela de entrar pede a senha nova. */
export const recoveryLink = Boolean(supabase && linkParams?.get('type') === 'recovery' && linkParams.get('access_token'))
/** O link de "esqueci a senha" venceu ou já foi usado. */
export const recoveryLinkFailed = Boolean(supabase && linkParams?.get('error_code'))

const recoveryReady =
  recoveryLink && supabase
    ? supabase.auth
        .setSession({ access_token: linkParams!.get('access_token')!, refresh_token: linkParams!.get('refresh_token') ?? '' })
        .then(({ error }) => error)
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

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase!.auth.signInWithPassword({ email, password })
  if (error) throw error
}

/** Cria a conta e já entra (sem e-mail de confirmação). */
export async function signUp(email: string, password: string): Promise<void> {
  const { data, error } = await supabase!.auth.signUp({ email, password })
  if (error) throw error
  // Se o painel ainda pedir confirmação, o Supabase não devolve sessão (e, se o e-mail já
  // existir, devolve um usuário sem identidades em vez de erro).
  if (!data.session) throw { code: data.user?.identities?.length === 0 ? 'user_already_exists' : 'email_not_confirmed' }
}

/** Manda o e-mail com o link para trocar a senha (volta para este mesmo endereço). */
export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase!.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}${location.pathname}`,
  })
  if (error) throw error
}

/** Grava a senha nova depois do link de "esqueci a senha". */
export async function setNewPassword(password: string): Promise<void> {
  const linkError = await recoveryReady
  if (linkError) throw linkError
  const { error } = await supabase!.auth.updateUser({ password })
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
