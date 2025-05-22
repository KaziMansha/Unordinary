import { NavBar } from './components/Navbar/Navbar.tsx'
import { Footer } from './components/Footer/Footer.tsx'
import { Hero } from './components/Hero/Hero.tsx'
import { HobbyCard } from './components/HobbyCard/HobbyCard.tsx'
import { Reviews } from './components/Reviews/Reviews.tsx'
import { CalendarCard } from './components/CalendarCard/CalendarCard.tsx'
import sampleCalendar from './assets/sample_calendar.png'
import kaziSample from './assets/kazi_sample.jpeg'
import cartiSample from './assets/carti_sample.png'
import skiing from './assets/skiing.jpg'
import image1 from '../assets/image_1.png'
import image2 from '../assets/image_2.jpg'
import image3 from '../assets/image_3.jpg'
import './Home.css'

const HomePage: React.FC = () => {
    return (
        <>
        <div className='wrapper'>
        <NavBar />
        <div className = "home-page-wrapper">
            <Hero />
            <HobbyCard
            image = { skiing }
            hobbyName= 'Skiing'
            description='Skiing is a great way to enjoy the outdoors and stay active during the winter months. It can be a fun and exhilarating experience, whether you are a beginner or an expert.'
            />
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href='https://allevents.in/waterville-valley/mountain-clean-up-and-pig-roast/200028219428459?utm_source=chatgpt.com' target='_blank' rel='noopener noreferrer' style={{ textDecoration: 'none' }}>
                <CalendarCard
                title="Festival of the Brewpubs at Arapahoe Basin"
                description="Location: Arapahoe Basin Ski Area, Colorado
                            Date: Sunday, May 25, 2025
                            Details: Celebrate the end of the ski season with unlimited tastings from local breweries, live music, and mountain views. For $40, attendees receive a festival mug and enjoy unlimited tastings from noon to 4:00 PM at Mountain Goat Plaza.
                            Learn More By Clicking Here!"            
                imageUrl= {image1}
                />
                </a>
                <a href='https://allevents.in/waterville-valley/mountain-clean-up-and-pig-roast/200028219428459?utm_source=chatgpt.com' target='_blank' rel='noopener noreferrer' style={{ textDecoration: 'none' }}>
                <CalendarCard
                title="Mountain Clean-Up and Pig Roast"
                description=" Location: Waterville Valley Resort, New Hampshire
                Date: Saturday, May 24, 2025
                Details: Join the community in preparing the mountain for summer with a clean-up event followed by a pig roast celebration.
                Learn More By Clicking Here!"            
                imageUrl= {image2}
                />
                </a>
                <a href='https://skivermont.com/events?utm_source=chatgpt.com' target='_blank' rel='noopener noreferrer' style={{ textDecoration: 'none' }}>
                <CalendarCard
                title="Stratton Mountain Scenic Lift Rides Opening Weekend"
                description="Location: Stratton Mountain Resort, Vermont
                Date: Starting Friday, May 23, 2025
                Details: Kick off the summer season with scenic gondola rides offering breathtaking views of Vermont's Green Mountains. The gondola will be spinning from 10:15 AM to 5:15 PM.
                Learn More By Clicking Here!"
                imageUrl= {image3}
                />
                </a>
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