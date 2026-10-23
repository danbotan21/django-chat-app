'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthCard, { Alert, Field, buttonClass, inputClass } from '@/components/AuthCard'
import { api, errorMessage, getSession, saveSession } from '@/lib/api'

const DEMO = { email: 'demo@chat.app', password: 'ChatDemo123!' }

export default function LogIn() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (getSession()) router.replace('/')
    setRegistered(new URLSearchParams(window.location.search).has('registered'))
  }, [router])

  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/auth/login/', form)
      saveSession(data)
      router.replace('/')
    } catch (err) {
      setError(errorMessage(err, 'Could not reach the server.'))
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title='Welcome back'
      subtitle='Log in to continue your conversations.'
      footer={
        <>
          New here?{' '}
          <Link href='/signup' className='font-semibold text-indigo-600 hover:underline'>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className='space-y-4'>
        {registered && !error && (
          <Alert type='success'>Account created. You can log in now.</Alert>
        )}
        {error && <Alert>{error}</Alert>}

        <Field label='Email'>
          <input
            type='email'
            name='email'
            required
            autoComplete='email'
            className={inputClass}
            placeholder='you@example.com'
            value={form.email}
            onChange={update}
          />
        </Field>
        <Field label='Password'>
          <input
            type='password'
            name='password'
            required
            autoComplete='current-password'
            className={inputClass}
            placeholder='••••••••'
            value={form.password}
            onChange={update}
          />
        </Field>

        <button type='submit' className={buttonClass} disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <button
          type='button'
          onClick={() => setForm(DEMO)}
          className='w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-sm text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600'
        >
          Use the demo account
        </button>
      </form>
    </AuthCard>
  )
}
