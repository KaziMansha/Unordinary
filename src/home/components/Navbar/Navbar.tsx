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
            <div className = {classes.authButtons}>
                <Link to="/login"><button className={classes.login}>Login</button></Link>
                <Link to="/signup"><button className={classes.login}>Sign Up</button></Link>
            </div>
        </nav>
        </>
    )
}