'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComments } from '@fortawesome/free-solid-svg-icons'
import Sidebar from '@/components/Sidebar'
import ChatWindow from '@/components/ChatWindow'
import AddFriendModal from '@/components/AddFriendModal'
import { api, clearSession, getSession } from '@/lib/api'
import { WS_URL } from '@/config'

const preview = (message) => ({
  text: message.text || (message.image ? 'Sent a photo' : 'Sent a file'),
  created_at: message.created_at,
  sender: message.sender,
})

export default function Home() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [friends, setFriends] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)
  const [addingFriend, setAddingFriend] = useState(false)
  const socket = useRef(null)

  const selectedFriend = friends.find((f) => f.id === selectedId)

  useEffect(() => {
    const saved = getSession()
    if (!saved) return router.replace('/login')
    setSession(saved)
    api.get('/conversation/friends/').then(({ data }) => setFriends(data))
  }, [router])

  // add a message once (it can arrive both from the upload response and the WebSocket)
  const addMessage = useCallback((message) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
    setFriends((prev) => {
      const friendId = prev.find((f) => f.id === message.sender) ? message.sender : selectedId
      const updated = prev.map((f) => (f.id === friendId ? { ...f, last_message: preview(message) } : f))
      // the conversation with the newest message goes to the top
      return [...updated.filter((f) => f.id === friendId), ...updated.filter((f) => f.id !== friendId)]
    })
  }, [selectedId])

  // load the conversation and open a WebSocket for it
  useEffect(() => {
    if (!selectedId || !session) return
    setMessages([])
    api.get('/conversation/', { params: { friendUserId: selectedId } })
      .then(({ data }) => setMessages(data.messages))

    const ws = new WebSocket(`${WS_URL}/ws/chat/${selectedId}/?token=${session.token}`)
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    socket.current = ws
    return () => ws.close()
  }, [selectedId, session])

  useEffect(() => {
    if (socket.current) socket.current.onmessage = (event) => addMessage(JSON.parse(event.data))
  }, [addMessage, selectedId])

  const sendText = (text) => {
    if (socket.current?.readyState !== WebSocket.OPEN) return false
    socket.current.send(JSON.stringify({ type: 'message', message: text }))
    return true
  }

  const logout = async () => {
    try {
      await api.post('/auth/log-out/')
    } finally {
      clearSession()
      router.replace('/login')
    }
  }

  const friendAdded = (friend) => {
    setFriends((prev) => [friend, ...prev])
    setSelectedId(friend.id)
    setAddingFriend(false)
  }

  if (!session) return null

  return (
    <div className='flex h-screen overflow-hidden'>
      <div className={`h-full w-full md:block md:w-80 lg:w-96 ${selectedId ? 'hidden' : 'block'}`}>
        <Sidebar
          me={session.user}
          friends={friends}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAddFriend={() => setAddingFriend(true)}
          onLogout={logout}
        />
      </div>

      <main className={`h-full min-w-0 flex-1 ${selectedId ? 'block' : 'hidden md:block'}`}>
        {selectedFriend ? (
          <ChatWindow
            me={session.user}
            friend={selectedFriend}
            messages={messages}
            connected={connected}
            onSendText={sendText}
            onUploaded={addMessage}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className='flex h-full flex-col items-center justify-center bg-slate-50 text-center'>
            <span className='flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-100 text-2xl text-indigo-600'>
              <FontAwesomeIcon icon={faComments} />
            </span>
            <h2 className='mt-4 text-xl font-semibold text-slate-900'>Your messages</h2>
            <p className='mt-1 text-slate-500'>Pick a conversation or add a new friend.</p>
            <button
              onClick={() => setAddingFriend(true)}
              className='mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-700'
            >
              Add a friend
            </button>
          </div>
        )}
      </main>

      {addingFriend && (
        <AddFriendModal onClose={() => setAddingFriend(false)} onAdded={friendAdded} />
      )}
    </div>
  )
}
