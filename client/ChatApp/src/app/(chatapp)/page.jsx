'use client'
import React, { useEffect, useState } from 'react'
import Style from './style.css'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import moment from 'moment'
import {
  faVideo,
  faUserPlus,
  faEllipsis,
  faImage,
  faPaperclip,
} from '@fortawesome/free-solid-svg-icons'

import { logOut } from '../Auth/LogIn/page'

const FriendList = ({
  setMessages,
  friendUserId,
  setFriendUserId,
  setCurrentFriendName,
}) => {
  const [userFriends, setUserFriends] = useState([])
  const [userId, setUserId] = useState(null)
  const [lastMessage, setLastMessage] = useState([])
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const friends = localStorage.getItem('user-friends')
    if (friends !== null) setUserFriends(JSON.parse(friends) ?? [])

    const id = localStorage.getItem('userId')
    if (id !== null) setUserId(id)
  }, [])

  const displayConversationWithAFriend = async (friendId) => {
    try {
      const resp = await axios.get(
        `http://127.0.0.1:8000/conversation/?userId=${userId}&friendUserId=${friendId}`,
      )
      const { data } = resp
      if (data.errorMessage) {
        setMessages([])
      } else {
        setMessages(data.message)
      }
    } catch (error) {
      setMessages([])
      console.log(error)
    }
  }

  const selectedFriendConversation = (friend) => {
    setFriendUserId(friend.id)
    setCurrentFriendName(friend.username)
  }

  useEffect(() => {
    if (friendUserId !== 0) displayConversationWithAFriend(friendUserId)
  }, [friendUserId])

  const getLastMesage = async (friendId) => {
    try {
      const resp = await axios.get(
        `http://127.0.0.1:8000/conversation/last-message/?userId=${userId}&friendUserId=${friendId}`,
      )

      const { data } = resp
      const arr = data.message

      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].image === null && arr[i].files === null) {
          const lastWords = arr[i].text
          let displayLastWords =
            lastWords.length <= 10 ? lastWords : lastWords.slice(0, 19) + '...'
          return displayLastWords
        }
      }
    } catch (error) {
      console.log(error)
      return null
    }
  }

  useEffect(() => {
    const fetchLastMessages = async () => {
      const messages = await Promise.all(
        userFriends.map(async (friend) => await getLastMesage(friend.id)),
      )

      setLastMessage(messages.filter((message) => message !== null))
    }

    if (userFriends.length > 0) {
      fetchLastMessages()
    }
  }, [userFriends])

  return (
    <div className='list-of-persons'>
      <hr className='idkkk' />
      <ul className='all-persons'>
        {(userFriends ?? []).map((friend, index) => (
          <li
            // className='person'
            className={`${
              friendUserId === friend.id ? 'person active' : 'person'
            }`}
            key={index}
            onClick={() => {
              selectedFriendConversation(friend)
            }}
          >
            <span className='person-image'>
              <img
                src={`http://localhost:8000/media/${friend.user_picture}`}
                alt={friend.username}
                className='person-image'
              />
            </span>
            <span className='person-nameLastmessage'>
              <p className='person-name'>{friend.username}</p>
              <p className='last-message'>{lastMessage[index]}</p>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const ChatConversation = ({
  messages,
  setMessages,
  userId,
  friendUserId,
  currentFriendName,
}) => {
  const [sendMessage, setSendMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedFile, setSelecteFile] = useState(null)
  const wsRef = React.useRef(null)
  const inputRef = React.useRef(null)
  const messagesEndRef = React.useRef(null)

  // Scroll automat la ultimul mesaj
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Conectare/deconectare WebSocket la schimbarea conversatiei
  useEffect(() => {
    if (!userId || !friendUserId) return

    // Inchide conexiunea veche daca exista
    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(
      `ws://localhost:8000/ws/chat/${userId}/${friendUserId}/`,
    )

    ws.onopen = () => {
      console.log(`WebSocket conectat: chat ${userId} <-> ${friendUserId}`)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // Adauga mesajul in lista doar daca NU l-am trimis noi (il primim de la celalalt user)
      // Ambii primesc mesajul via group_send, deci adaugam mereu la state
      setMessages((prev) => {
        // Evita duplicatele: daca mesajul exista deja (by created_at+sender), nu-l mai adaugam
        const exists = (prev || []).some(
          (m) => m.created_at === data.created_at && m.sender === data.sender,
        )
        if (exists) return prev
        return [...(prev || []), data]
      })
    }

    ws.onclose = () => {
      console.log('WebSocket deconectat')
    }

    ws.onerror = (err) => {
      console.log('WebSocket eroare:', err)
    }

    wsRef.current = ws

    return () => {
      ws.close()
    }
  }, [userId, friendUserId])

  const messageValue = (e) => {
    setSendMessage(e.target.value)
  }

  const handleImageChange = (e) => {
    setSelectedImage(e.target.files[0])
  }

  const handleFileChange = (e) => {
    setSelecteFile(e.target.files[0])
  }

  const userSendMessage = (event) => {
    event.preventDefault()
    if (!sendMessage || !sendMessage.trim()) return
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(
      JSON.stringify({
        type: 'message',
        userId: userId,
        message: sendMessage.trim(),
      }),
    )

    setSendMessage('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const userSendImage = async () => {
    const formData = new FormData()
    formData.append('userId', userId)
    formData.append('friendUserId', friendUserId)
    formData.append('image', selectedImage)

    try {
      const resp = await axios.post(
        `http://127.0.0.1:8000/conversation/send-image/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      if (resp.data.mesajul) {
        setMessages((prev) => [...(prev || []), resp.data.mesajul])
      }
    } catch (error) {
      console.log(error)
    }
  }

  const userSendFile = async () => {
    const formData = new FormData()
    formData.append('userId', userId)
    formData.append('friendUserId', friendUserId)
    formData.append('file', selectedFile)

    try {
      const resp = await axios.post(
        `http://127.0.0.1:8000/conversation/send-file/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      if (resp.data.mesajul) {
        setMessages((prev) => [...(prev || []), resp.data.mesajul])
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (selectedImage !== null) {
      userSendImage()
      setSelectedImage(null)
    }
  }, [selectedImage])

  useEffect(() => {
    if (selectedFile !== null) {
      userSendFile()
      setSelecteFile(null)
    }
  }, [selectedFile])

  return (
    <div className='chat-conversation'>
      <div className='person-control'>
        <span className='person-name-conversation'>
          {currentFriendName !== undefined ? currentFriendName : ''}
        </span>

        <div className='icons-control'>
          <FontAwesomeIcon className='chat-icon' icon={faVideo} />
          <FontAwesomeIcon className='chat-icon' icon={faUserPlus} />
          <FontAwesomeIcon className='chat-icon' icon={faEllipsis} />
        </div>
      </div>

      <div className='person-conversation'>
        <div className='message-container'>
          {messages && messages.length > 0 ? (
            <ul>
              {messages.map((message, index) => (
                <div className='message' key={index}>
                  <div
                    className={
                      userId === message.sender ? 'test' : 'test friend'
                    }
                  >
                    <span className='image-time'>
                      {message.user && message.user.user_picture ? (
                        <img
                          src={`http://localhost:8000${message.user.user_picture}`}
                          className='img-conversation'
                          alt={`${message.user.username}`}
                        />
                      ) : null}
                      <p className='time-send-message'>
                        {moment(message.created_at).format(
                          'MMM DD [at] HH:mm A',
                        )}
                      </p>
                    </span>

                    {message.text ? (
                      <li
                        className={
                          userId === message.sender
                            ? 'message-self'
                            : 'message-friend'
                        }
                      >
                        {message.text}
                      </li>
                    ) : null}

                    {message.image ? (
                      <div className='image-sent'>
                        <img
                          src={`http://localhost:8000/media/${message.image}`}
                          alt='Sent image'
                          className='sent-image'
                        />
                      </div>
                    ) : null}

                    {message.files ? (
                      <a
                        href={`http://localhost:8000/media/${message.files}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='link'
                      >
                        {message.files.slice(13)}
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </ul>
          ) : (
            <div className='start-chat-conversation'>
              <p className='start-conversation'>
                Start a conversation with a friend
              </p>
            </div>
          )}{' '}
          <div ref={messagesEndRef} />{' '}
        </div>
      </div>

      <div className='write-messages'>
        <form className='send-messages'>
          <span className='input-message'>
            <input
              ref={inputRef}
              type='text'
              name='message'
              placeholder='Type Something...'
              value={sendMessage}
              onChange={messageValue}
              onKeyDown={(e) => {
                if (e.key === 'Enter') userSendMessage(e)
              }}
            />
          </span>

          <span className='icons-chat-interactions'>
            <input
              type='file'
              id='files'
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <label htmlFor='files'>
              <FontAwesomeIcon className='icon paperclip' icon={faPaperclip} />
            </label>

            <input
              type='file'
              id='image'
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            <label htmlFor='image'>
              <FontAwesomeIcon className='icon picture-icon' icon={faImage} />
            </label>
            <button onClick={userSendMessage}>Send</button>
          </span>
        </form>
      </div>
    </div>
  )
}

export const Chat = () => {
  const [messages, setMessages] = useState(null)
  const [friendUserId, setFriendUserId] = useState(0)
  const [userId, setUserdId] = useState(0)
  const [currentFriendName, setCurrentFriendName] = useState(null)

  const [storedUsername, setStoredUsername] = useState(null)
  const [userPicture, setUserPicture] = useState(null)

  useEffect(() => {
    const username = localStorage.getItem('username')
    if (username !== null) setStoredUsername(username)

    const picture = localStorage.getItem('user-picture')
    if (picture !== null) setUserPicture(picture)

    const id = localStorage.getItem('userId')
    if (id !== null) setUserdId(Number(id))
  }, [])

  return (
    <div className='chat-app-parent'>
      <div className='chat-person'>
        <div className='our-account-detail'>
          <div className='details-profile'>
            <img
              src={`http://localhost:8000${userPicture}`}
              alt={storedUsername}
              className='user-image'
            />
            <p className='name'>{storedUsername}</p>
            <button className='log-out' onClick={logOut}>
              Log Out
            </button>
          </div>
        </div>

        {/* Aici este componenta ce afiseaza toti prietenii in partea stanga */}
        <FriendList
          setMessages={setMessages}
          friendUserId={friendUserId}
          setFriendUserId={setFriendUserId}
          setCurrentFriendName={setCurrentFriendName}
        />
      </div>

      {/* Aici este componenta ce afiseaza conversatia userului cu un anumit prieten */}
      <ChatConversation
        messages={messages}
        setMessages={setMessages}
        userId={userId}
        friendUserId={friendUserId}
        currentFriendName={currentFriendName}
      />
    </div>
  )
}

export default Chat
