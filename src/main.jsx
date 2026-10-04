import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

const storageMigrations = [
  ['civicfix_token', 'civora_token'],
  ['civicfix_issues', 'civora_issues'],
]

storageMigrations.forEach(([legacyKey, currentKey]) => {
  if (localStorage.getItem(currentKey) === null && localStorage.getItem(legacyKey) !== null) {
    localStorage.setItem(currentKey, localStorage.getItem(legacyKey))
  }
})

if (sessionStorage.getItem('civora_welcomed') === null && sessionStorage.getItem('civicfix_welcomed') !== null) {
  sessionStorage.setItem('civora_welcomed', sessionStorage.getItem('civicfix_welcomed'))
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
