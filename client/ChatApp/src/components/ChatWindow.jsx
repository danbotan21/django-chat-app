import { Fragment, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faFileLines,
  faImage,
  faPaperPlane,
  faPaperclip,
} from '@fortawesome/free-solid-svg-icons'
import Avatar from './Avatar'
import { api, errorMessage, mediaUrl } from '../lib/api'
import { clockTime, dayLabel } from '../lib/time'

function MessageContent({ message, mine }) {
  if (message.image) {
    return (
      <a href={mediaUrl(message.image)} target='_blank' rel='noopener noreferrer'>
        <img
          src={mediaUrl(message.image)}
          alt='Photo'
          className='max-h-72 max-w-full rounded-2xl border border-slate-200 object-cover sm:max-w-xs'
        />
      </a>
    )
  }

  if (message.files) {
    return (
      <a
        href={mediaUrl(message.files)}
        target='_blank'
        rel='noopener noreferrer'
        className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
          mine ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-slate-200 bg-white hover:bg-slate-50'
        }`}
      >
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            mine ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          <FontAwesomeIcon icon={faFileLines} />
        </span>
        <span>
          <span className='block text-sm font-semibold'>{message.file_name}</span>
          <span className={`block text-xs ${mine ? 'text-indigo-100' : 'text-slate-500'}`}>
            Click to open
          </span>
        </span>
      </a>
    )
  }

  return (
    <p
      className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 ${
        mine
          ? 'rounded-br-md bg-indigo-600 text-white'
          : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
      }`}
    >
      {message.text}
    </p>
  )
}

export default function ChatWindow({ me, friend, messages, connected, onSendText, onUploaded, onBack }) {
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const endRef = useRef(null)

  const shown = useRef(0)

  // jump to the bottom when a conversation opens, scroll smoothly for new messages
  useEffect(() => {
    const oneNew = messages.length === shown.current + 1
    endRef.current?.scrollIntoView({ behavior: oneNew ? 'smooth' : 'auto' })
    shown.current = messages.length
  }, [messages])

  const send = (event) => {
    event.preventDefault()
    if (!text.trim()) return
    if (onSendText(text.trim())) setText('')
  }

  const upload = async (event, kind) => {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return

    const data = new FormData()
    data.append('friendUserId', friend.id)
    data.append(kind, file)
    setError(null)
    try {
      const response = await api.post(`/conversation/send-${kind}/`, data)
      onUploaded(response.data)
    } catch (err) {
      setError(errorMessage(err, 'Upload failed.'))
    }
  }

  return (
    <section className='flex h-full flex-col bg-slate-50'>
      <header className='flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3.5'>
        <button onClick={onBack} className='mr-1 text-slate-500 md:hidden'>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <Avatar user={friend} />
        <div>
          <p className='font-semibold text-slate-900'>{friend.username}</p>
          <p className='flex items-center gap-1.5 text-xs text-slate-500'>
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
            {connected ? 'Live' : 'Connecting...'}
          </p>
        </div>
      </header>

      <div className='flex-1 overflow-y-auto px-4 py-6 sm:px-8'>
        {messages.length === 0 && (
          <p className='mt-20 text-center text-slate-500'>
            This is the start of your conversation with {friend.username}.
          </p>
        )}

        <ul className='space-y-3'>
          {messages.map((message, index) => {
            const mine = message.sender === me.id
            const previous = messages[index - 1]
            const newDay = !previous || dayLabel(previous.created_at) !== dayLabel(message.created_at)
            return (
              <Fragment key={message.id}>
                {newDay && (
                  <li className='py-2 text-center text-xs font-medium text-slate-400'>
                    {dayLabel(message.created_at)}
                  </li>
                )}
                <li className={`flex items-end gap-2 ${mine ? 'justify-end' : ''}`}>
                  {!mine && <Avatar user={friend} size='sm' />}
                  <div className={`flex max-w-[75%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <MessageContent message={message} mine={mine} />
                    <span className='mt-1 px-1 text-[11px] text-slate-400'>
                      {clockTime(message.created_at)}
                    </span>
                  </div>
                </li>
              </Fragment>
            )
          })}
        </ul>
        <div ref={endRef} />
      </div>

      {error && <p className='px-5 pb-2 text-sm text-rose-600'>{error}</p>}

      <form onSubmit={send} className='flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-3'>
        <label title='Send a photo' className='cursor-pointer rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600'>
          <FontAwesomeIcon icon={faImage} />
          <input type='file' accept='image/*' className='hidden' onChange={(e) => upload(e, 'image')} />
        </label>
        <label title='Send a file' className='cursor-pointer rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600'>
          <FontAwesomeIcon icon={faPaperclip} />
          <input type='file' className='hidden' onChange={(e) => upload(e, 'file')} />
        </label>
        <input
          className='min-w-0 flex-1 rounded-xl bg-slate-100 px-4 py-3 outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-200'
          placeholder={`Message ${friend.username}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type='submit'
          disabled={!text.trim() || !connected}
          className='flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-40'
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </section>
  )
}
