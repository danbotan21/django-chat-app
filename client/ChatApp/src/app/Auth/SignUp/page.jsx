'use client'
import { useState, useEffect } from 'react'
import Style from './style.css'
import { useRouter } from 'next/router'

import onSubmitFormSignUp from './submitForm'

export default function page() {
  const [username, setUserName] = useState(null)
  const [email, setEmail] = useState(null)
  const [password, setPassword] = useState(null)
  const [confirm_password, setConfirm_Password] = useState(null)

  const [user_picture, setUserPicture] = useState(null)
  const [errorMessage, setErroMessage] = useState(null)

  const handleInputChange = (event, setStateFunction) => {
    event.preventDefault()
    setStateFunction(event.target.value)
  }

  const handleUserPicture = (event) => {
    const file = event.target.files[0]
    setUserPicture(file)
  }

  const Submit = () => {
    event.preventDefault()

    if (username.length < 10) {
      alert('User name must be longer')
    } else if (email.length < 18) alert('Email must be longer')
    else if (password.length < 8) alert('Parola e prea scurta')
    else if (user_picture === null) alert('An image must to be selected')

    const data = new FormData()
    data.append('username', username)
    data.append('email', email)
    data.append('password', password)
    data.append('confirm_password', confirm_password)
    data.append('user_picture', user_picture)

    onSubmitFormSignUp(data)

    alert('The account was created sucessfully')

    setTimeout(() => {
      window.location.href = '/Auth/LogIn'
    }, 1500)
  }

  return (
    <div className='sign-up-parent'>
      <div className='sing-up-content'>
        <form
          className='form-sign-up'
          encType='multipart/form-data'
          onSubmit={() => Submit()}
        >
          <h3 className='header-content'>Register</h3>

          <input
            type='text'
            className='content-sign-up name-sign-up'
            name='name'
            id='name'
            placeholder='Name'
            onChange={(event) => handleInputChange(event, setUserName)}
          />

          <input
            type='email'
            className='content-sign-up email-sign-up'
            name='email'
            id='email'
            placeholder='Email'
            required
            onChange={(event) => handleInputChange(event, setEmail)}
          />

          <input
            type='password'
            className='content-sign-up password-sign-up'
            name='password'
            id='password'
            placeholder='Password'
            onChange={(event) => handleInputChange(event, setPassword)}
          />

          <input
            type='password'
            className='content-sign-up'
            name='confirm-password'
            id='confirm-password'
            placeholder='Confirm Password'
            onChange={(event) => handleInputChange(event, setConfirm_Password)}
          />

          <input
            type='file'
            className='content-sign-up'
            name='user_picture'
            id='user_picture'
            onChange={handleUserPicture}
          />

          <button className='btn-signup'>Sign Up</button>

          <p className='have-an-account'>
            Have an Account?
            <a href='LogIn' style={{ color: 'red', fontWeight: 400 }}>
              Login Here
            </a>
          </p>
        </form>
      </div>
    </div>
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
