const KEY = 'lumina_token'

export const saveToken = (token: string) => localStorage.setItem(KEY, token)
export const getToken = () => localStorage.getItem(KEY)
export const clearToken = () => localStorage.removeItem(KEY)
export const isLoggedIn = () => Boolean(getToken())
