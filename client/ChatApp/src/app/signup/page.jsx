'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera } from '@fortawesome/free-solid-svg-icons'
import AuthCard, { Alert, Field, buttonClass, inputClass } from '@/components/AuthCard'
import { api, errorMessage } from '@/lib/api'

const validate = ({ username, password, confirm_password }) => {
  if (username.trim().length < 3) return 'The username needs at least 3 characters.'
  if (password.length < 8) return 'The password needs at least 8 characters.'
  if (password !== confirm_password) return 'The passwords do not match.'
  return null
}

export default function SignUp() {
  const router = useRouter()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  const [picture, setPicture] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    const problem = validate(form)
    if (problem) return setError(problem)

    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => data.append(key, value))
    if (picture) data.append('user_picture', picture)

    setLoading(true)
    setError(null)
    try {
      await api.post('/signup/create-users/', data)
      router.push('/login?registered=1')
    } catch (err) {
      setError(errorMessage(err, 'Could not reach the server.'))
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title='Create your account'
      subtitle='Add friends and start chatting in real time.'
      footer={
        <>
          Already have an account?{' '}
          <Link href='/login' className='font-semibold text-indigo-600 hover:underline'>
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className='space-y-4'>
        {error && <Alert>{error}</Alert>}

        <label className='mx-auto flex w-fit cursor-pointer flex-col items-center gap-2'>
          <span className='flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-indigo-400'>
            {picture ? (
              <img
                src={URL.createObjectURL(picture)}
                alt='Profile picture'
                className='h-full w-full object-cover'
              />
            ) : (
              <FontAwesomeIcon icon={faCamera} className='text-xl' />
            )}
          </span>
          <span className='text-xs text-slate-500'>Profile picture (optional)</span>
          <input
            type='file'
            accept='image/*'
            className='hidden'
            onChange={(e) => setPicture(e.target.files[0] || null)}
          />
        </label>

        <Field label='Username'>
          <input name='username' required className={inputClass} value={form.username} onChange={update} />
        </Field>
        <Field label='Email'>
          <input type='email' name='email' required className={inputClass} value={form.email} onChange={update} />
        </Field>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='Password'>
            <input type='password' name='password' required className={inputClass} value={form.password} onChange={update} />
          </Field>
          <Field label='Confirm password'>
            <input
              type='password'
              name='confirm_password'
              required
              className={inputClass}
              value={form.confirm_password}
              onChange={update}
            />
          </Field>
        </div>

        <button type='submit' className={buttonClass} disabled={loading}>
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
    </AuthCard>
  )
}
