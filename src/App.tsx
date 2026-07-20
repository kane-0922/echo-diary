import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import Sidebar from './components/layout/Sidebar'
import MobileMenuButton from './components/layout/MobileMenuButton'
import SidebarOverlay from './components/layout/SidebarOverlay'
import ChatPage from './components/chat/ChatPage'
import DiaryEditPage from './components/diary/DiaryEditPage'
import DiaryListPage from './components/diary-list/DiaryListPage'
import ToastContainer from './components/shared/ToastContainer'
import DecorativeBlur from './components/shared/DecorativeBlur'

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <DecorativeBlur />
        <div className="app-shell">
          <Sidebar />
          <MobileMenuButton />
          <SidebarOverlay />
          <main className="main-content">
            <Routes>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/diary/:id/edit" element={<DiaryEditPage />} />
              <Route path="/diaries" element={<DiaryListPage />} />
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </main>
        </div>
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
