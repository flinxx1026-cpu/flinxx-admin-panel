import bcryptjs from 'bcryptjs'

const password = 'nkhlydv'
const saltRounds = 10

bcryptjs.hash(password, saltRounds).then(hash => {
  console.log('Generated bcrypt hash for password "nkhlydv":')
  console.log(hash)
  console.log('\n')
  console.log('Use this SQL command in Render database to update the admin password:')
  console.log('\n')
  console.log(`UPDATE "Admin" SET password = '${hash}' WHERE email = 'Nikhilyadav1026@flinxx.com';`)
})
