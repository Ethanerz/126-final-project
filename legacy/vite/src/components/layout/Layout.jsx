import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import AuthModal from '../AuthModal'

export default function Layout() {
  return (
    <>
      <Header />
      <main className="rupv-main">
        <Outlet />
      </main>
      <Footer />
      <AuthModal />
    </>
  )
}
