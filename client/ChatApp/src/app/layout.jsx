'use client'
import { Inter } from 'next/font/google'
import './globals.css'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'
import { useState, createContext, useId } from 'react'

config.autoAddCss = false

const inter = Inter({ subsets: ['latin'] })

export const DateleUseruluiContext = createContext({})

export default function RootLayout({ children }) {
  const [userName, setUserName] = useState('')
  const [userPicture, setUserPicture] = useState('')
  const [userId, setUserId] = useState(0)
  const [userFriends, setUserFriends] = useState([])

  return (
    <html lang='en'>
      <body className={inter.className}>
        <DateleUseruluiContext.Provider
          value={{
            userName,
            setUserName,
            userPicture,
            setUserPicture,
            userId,
            setUserId,
            userFriends,
            setUserFriends,
          }}
        >
          {children}
        </DateleUseruluiContext.Provider>
      </body>
    </html>
  )
}
