import { NavBar } from './components/Navbar/Navbar.tsx'
import { Footer } from './components/Footer/Footer.tsx'
import { Hero } from './components/Hero/Hero.tsx'
import { HobbyCard } from './components/HobbyCard/HobbyCard.tsx'
import unordinaryLogo from './assets/Unordinary_Logo.png'

const HomePage: React.FC = () => {
    return (
        <>
        <NavBar />
        <Hero />
        <HobbyCard
        image = { unordinaryLogo }
        hobbyName= 'Unordinary'
        description='Unordinary'
        />
        <Footer />
        </>
    )
}

export default HomePage;