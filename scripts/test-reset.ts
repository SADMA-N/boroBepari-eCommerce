import { auth } from '../src/lib/auth'

console.log('Starting forgetPassword test...')

const request = new Request('http://localhost:3000/api/auth/forget-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'pubgmerabeta1@gmail.com',
    redirectTo: '/reset-password',
  }),
})

const response = await auth.handler(request)
console.log('Status:', response.status)
const body = await response.text()
console.log('Body:', body)
process.exit(0)
