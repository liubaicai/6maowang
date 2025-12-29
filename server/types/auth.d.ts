declare module '#auth-utils' {
  interface User {
    id: number
    username: string
    role: string
    nickname?: string
  }
  
  interface UserSession {
    user: User
  }
}

export {}
