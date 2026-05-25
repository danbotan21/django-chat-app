'use client'
import { useEffect, useState } from 'react'
import { Chat } from './(chatapp)/page'
import LogIn from './Auth/LogIn/page'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(null)

  useEffect(() => {
    const username = localStorage.getItem('username')
    const userId = localStorage.getItem('userId')
    setIsLoggedIn(username !== null && userId !== null)
  }, [])

  if (isLoggedIn === null) return null // loading

  return isLoggedIn ? <Chat /> : <LogIn />
}
