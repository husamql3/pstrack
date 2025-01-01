import { createAuthClient } from 'better-auth/react' // make sure to import from better-auth/react

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
  },
  github: {
    enabled: true,
  },
  google: {
    enabled: true,
  },
})
