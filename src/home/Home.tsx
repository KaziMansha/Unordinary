import { NavBar } from './components/Navbar/Navbar.tsx'
import { Footer } from './components/Footer/Footer.tsx'
import { Hero } from './components/Hero/Hero.tsx'
import { HobbyCard } from './components/HobbyCard/HobbyCard.tsx'
import { Reviews } from './components/Reviews/Reviews.tsx'
import { CalendarCard } from './components/CalendarCard/CalendarCard.tsx'
import unordinaryLogo from './assets/Unordinary_Logo.png'
import sampleCalendar from './assets/sample_calendar.png'
import kaziSample from './assets/kazi_sample.jpeg'
import dudeStock from './assets/dude_sample.jpeg'

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
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <CalendarCard
            title="Calendar 1"
            description="Check out this calendar!"            
            imageUrl= {sampleCalendar}
            />
            <CalendarCard
            title="Calendar 2"
            description="Check out this calendar!"            
            imageUrl= {sampleCalendar}
            />
            <CalendarCard
            title="Calendar 3"
            description="Check out this calendar!"
            imageUrl= {sampleCalendar}
            />
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <Reviews
            userName="Kazi"
            text="I absolutely love this app! It has changed how I organize my days."
            userSince="2025"
            userImage = {kaziSample}
            />
            <Reviews
            userName="Jeff"
            text="Certified banger, I use it every day!"
            userSince="2025"
            userImage = {dudeStock}
            />
        </div>
        <Footer />
        </>
    )
}

export default HomePage;