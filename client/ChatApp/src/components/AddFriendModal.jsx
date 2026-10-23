import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import Avatar from './Avatar'
import { api, errorMessage } from '../lib/api'

export default function AddFriendModal({ onClose, onAdded }) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/conversation/users/', { params: { search } })
        setUsers(data)
      } catch (err) {
        setError(errorMessage(err))
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

  const add = async (user) => {
    try {
      const { data } = await api.post('/conversation/friends/', { friendId: user.id })
      onAdded(data)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div
      className='fixed inset-0 z-20 flex items-start justify-center bg-slate-900/40 px-4 pt-24 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-bold text-slate-900'>Add a friend</h2>
          <button onClick={onClose} className='rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100'>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <input
          autoFocus
          className='mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'
          placeholder='Search by username'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {error && <p className='mt-3 text-sm text-rose-600'>{error}</p>}

        <ul className='mt-4 max-h-80 space-y-1 overflow-y-auto'>
          {users.map((user) => (
            <li key={user.id} className='flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-slate-50'>
              <Avatar user={user} />
              <span className='flex-1 font-medium text-slate-800'>{user.username}</span>
              <button
                onClick={() => add(user)}
                className='rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700'
              >
                Add
              </button>
            </li>
          ))}
          {users.length === 0 && (
            <li className='py-6 text-center text-sm text-slate-500'>
              No one to add{search && ` for "${search}"`}.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
