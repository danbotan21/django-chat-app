import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComments } from '@fortawesome/free-solid-svg-icons'

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

export const buttonClass =
  'w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60'

export function Field({ label, children }) {
  return (
    <label className='block'>
      <span className='mb-1.5 block text-sm font-medium text-slate-700'>
        {label}
      </span>
      {children}
    </label>
  )
}

export function Alert({ type = 'error', children }) {
  const styles =
    type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return (
    <p className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{children}</p>
  )
}

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <main className='flex min-h-screen items-center justify-center px-4 py-10'>
      <div className='w-full max-w-md'>
        <div className='mb-8 flex items-center justify-center gap-3'>
          <span className='flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200'>
            <FontAwesomeIcon icon={faComments} />
          </span>
          <span className='text-2xl font-bold text-slate-900'>ChatApp</span>
        </div>

        <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60'>
          <h1 className='text-2xl font-bold text-slate-900'>{title}</h1>
          <p className='mt-1 text-slate-500'>{subtitle}</p>
          <div className='mt-6'>{children}</div>
        </div>

        <p className='mt-6 text-center text-sm text-slate-500'>{footer}</p>
      </div>
    </main>
  )
}
