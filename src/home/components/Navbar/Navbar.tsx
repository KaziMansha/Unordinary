import React from 'react'
import { Link } from 'react-router-dom'
import classes from './Navbar.module.css'
import Unordinary_Logo from '../../assets/Unordinary_Logo.png'

export function NavBar() {
    return (
        <>
        <nav className = {classes.navbar}>
            <div className = {classes.logo}>
                <img src = {Unordinary_Logo} alt = "Unordinary Logo" />
            </div>
            <ul className = {classes.navLinks}>
                <li>
                    <Link to="/">Home</Link>
                </li>
                <li>
                    <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                    <Link to="*">About</Link>
                </li>
            </ul>
            <div className = {classes.authButtons}>
                <Link to="/login"><button className={classes.login}>Login</button></Link>
                <Link to="/signup"><button className={classes.login}>Sign Up</button></Link>
            </div>
        </nav>
        </>
    )
}