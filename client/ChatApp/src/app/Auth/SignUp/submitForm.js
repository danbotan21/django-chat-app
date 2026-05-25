const onSubmitFormSignUp = async (data) => {
  event.preventDefault()

  try {
    const resp = await fetch(`http://127.0.0.1:8000/signup/create-users/`, {
      method: 'POST',
      body: data,
    })

    if (resp.status === 200) {
      console.log('Userul a fost creat cu succes!')
    } else {
      console.error('Eroare la crearea utilizatorului.')
    }
    const datele = await resp.json()
    console.log(datele)
    if (datele.error) alert(datele.error)
  } catch (error) {
    console.error(error)
  }
}

export default onSubmitFormSignUp
