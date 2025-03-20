import classes from './Home.module.css'
import { NavBar } from './components/Navbar/Navbar.tsx'
import { Footer } from './components/Footer/Footer.tsx'


export function HomePage() {
    return (
        <>
        <NavBar />
        <h1>
            Temp Code
        </h1>
        <Footer />
        </>
    )
}