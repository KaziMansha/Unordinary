import { NavBar } from './components/Navbar/Navbar.tsx'
import { Footer } from './components/Footer/Footer.tsx'
import { Hero } from './components/Hero/Hero.tsx'
import { HobbyCard } from './components/HobbyCard/HobbyCard.tsx'
import { Reviews } from './components/Reviews/Reviews.tsx'
import { CalendarCard } from './components/CalendarCard/CalendarCard.tsx'
import sampleCalendar from './assets/sample_calendar.png'
import kaziSample from './assets/kazi_sample.jpeg'
import cartiSample from './assets/carti_sample.png'
import creativeWriting from './assets/creative_writing.jpg'
import './Home.css'

const HomePage: React.FC = () => {
    return (
        <>
        <div className='wrapper'>
        <NavBar />
        <div className = "home-page-wrapper">
            <Hero />
            <HobbyCard
            image = { creativeWriting }
            hobbyName= 'Creative Writing'
            description='Write short stories, poems, or even start your own novel. It’s a great way to express yourself and improve your communication skills.'
            />
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <CalendarCard
                title="Event 1"
                description="Check out this event!"            
                imageUrl= {sampleCalendar}
                />
                <CalendarCard
                title="Event 2"
                description="Check out this event!"            
                imageUrl= {sampleCalendar}
                />
                <CalendarCard
                title="Event 3"
                description="Check out this event!"
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
                userName="Playboi Shmarti"
                text="SEEEYUH!!! ABSOLUTE BANGA, MAKES ME WANNA PLAN MY ALBUM! FWAEH!"
                userSince="2017"
                userImage = {cartiSample}
                />
            </div>
        </div>
        <Footer />
        </div>
        </>
    )
}

export default HomePage;