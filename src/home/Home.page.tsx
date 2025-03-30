import classes from './Home.module.css'
import { NavBar } from './components/Navbar/Navbar.tsx'
import { Footer } from './components/Footer/Footer.tsx'
import { Hero } from './components/Hero/Hero'

export function HomePage() {
    return (
        <>
        <NavBar />
        <Hero />
        <Footer />
        </>
    )
}