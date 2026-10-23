import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faComments,
  faMagnifyingGlass,
  faRightFromBracket,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons'
import Avatar from './Avatar'
import { shortAgo } from '../lib/time'

export default function Sidebar({ me, friends, selectedId, onSelect, onAddFriend, onLogout }) {
  const [filter, setFilter] = useState('')
  const visible = friends.filter((f) =>
    f.username.toLowerCase().includes(filter.trim().toLowerCase()),
  )

  return (
    <aside className='flex h-full flex-col border-r border-slate-200 bg-white'>
      <div className='flex items-center justify-between px-5 pb-4 pt-5'>
        <div className='flex items-center gap-2 text-lg font-bold text-slate-900'>
          <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm text-white'>
            <FontAwesomeIcon icon={faComments} />
          </span>
          Chats
        </div>
        <button
          onClick={onAddFriend}
          title='Add a friend'
          className='flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100'
        >
          <FontAwesomeIcon icon={faUserPlus} />
        </button>
      </div>

      <div className='relative mx-5 mb-3'>
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className='absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400'
        />
        <input
          className='w-full rounded-xl bg-slate-100 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-200'
          placeholder='Search friends'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <ul className='flex-1 overflow-y-auto px-3'>
        {visible.map((friend) => {
          const last = friend.last_message
          const fromMe = last && last.sender === me.id
          return (
            <li key={friend.id}>
              <button
                onClick={() => onSelect(friend.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  selectedId === friend.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                }`}
              >
                <Avatar user={friend} />
                <span className='min-w-0 flex-1'>
                  <span className='flex items-baseline justify-between gap-2'>
                    <span className='truncate font-semibold text-slate-900'>
                      {friend.username}
                    </span>
                    {last && (
                      <span className='shrink-0 text-xs text-slate-400'>
                        {shortAgo(last.created_at)}
                      </span>
                    )}
                  </span>
                  <span className='block truncate text-sm text-slate-500'>
                    {last ? `${fromMe ? 'You: ' : ''}${last.text}` : 'Say hi 👋'}
                  </span>
                </span>
              </button>
            </li>
          )
        })}

        {friends.length === 0 && (
          <li className='px-3 py-10 text-center text-sm text-slate-500'>
            No friends yet.{' '}
            <button onClick={onAddFriend} className='font-semibold text-indigo-600 hover:underline'>
              Add someone
            </button>
          </li>
        )}
      </ul>

      <div className='flex items-center gap-3 border-t border-slate-200 px-5 py-4'>
        <Avatar user={me} size='sm' />
        <span className='flex-1 truncate font-medium text-slate-800'>{me.username}</span>
        <button
          onClick={onLogout}
          title='Log out'
          className='rounded-lg px-2 py-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600'
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
        </button>
      </div>
    </aside>
  )
}
