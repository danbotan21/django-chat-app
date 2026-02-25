'use client'
import { useState, useContext } from 'react'
import Style from './style.css'
import { Chat } from '../../(chatapp)/page'
import { DateleUseruluiContext } from '@/app/layout'

export const logOut = async () => {
  try {
    const resp = await fetch(`http://127.0.0.1:8000/auth/log-out/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await resp.json()
    localStorage.removeItem('username')
    localStorage.removeItem('user-picture')
    localStorage.removeItem('userId')
    localStorage.removeItem('user-friends')
    window.location.href = '/'
  } catch (error) {
    console.log(error)
  }
}

export default function LogIn() {
  const [email, setEmail] = useState(null)
  const [password, setPassword] = useState(null)

  const onSubmitFormLogIn = async (data) => {
    event.preventDefault()

    try {
      const resp = await fetch(`http://127.0.0.1:8000/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const datele = await resp.json()

      if (datele.error) {
        alert(datele.error)
      } else {
        alert('Te-ai logat cu suces')

        localStorage.setItem('username', datele.username)
        localStorage.setItem('user-picture', datele.image)
        localStorage.setItem('userId', datele.userId)
        const friendsString = JSON.stringify(datele.friends)

        localStorage.setItem('user-friends', friendsString)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleInputChange = (event, setStateFunction) => {
    event.preventDefault()
    setStateFunction(event.target.value)
  }

  const data = { email, password }

  const Submit = () => {
    onSubmitFormLogIn(data)

    setTimeout(() => {
      if (localStorage.getItem('username') !== null) {
        window.location.href = '/'
      }
    }, 1500)
  }

  return (
    <>
      <div className='log-in-parent'>
        <div className='log-in-content'>
          <div className='form-logic'>
            <form className='form-log-in' onSubmit={() => Submit()}>
              <h3 className='header-content'>LogIn</h3>

              <input
                type='email'
                className='content-log-in '
                name='email'
                id='email'
                placeholder='Email'
                onChange={(event) => handleInputChange(event, setEmail)}
              />

              <input
                type='password'
                className='content-log-in'
                name='password'
                id='password'
                placeholder='Password'
                onChange={(event) => handleInputChange(event, setPassword)}
              />

              <button className='btn-log-in' type='submit'>
                LogIn
              </button>

              <p className='have-an-account'>
                Not a member?
                <a href='SignUp' style={{ color: 'red', fontWeight: 400 }}>
                  Sign Up Now
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

{
  /* {errorBoolean && (
          <div className='error-display'>
            <p className='error-header'>{errorMsg}</p>
          </div>
        )}

        {successBoolean && (
          <div className='success-display'>
            <p className='success-header'>{successMsg}</p>
          </div>
        )} */
}
