declare module '#auth-utils' {
  interface User {
    id: number
    username: string
  }
  
  interface UserSession {
    user: User
  }
}

export {}
