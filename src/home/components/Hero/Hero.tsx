import classes from './Hero.module.css'

export function Hero() {
  return (
    <section className={classes.hero}>
      <div className={classes.content}>
        <h1 className={classes.headline}>
          Making the <span className={classes.highlight}>Unordinary</span> Ordinary
        </h1>
        <p className={classes.subText}>
          Empowering your day with smart, intuitive scheduling that adapts to you.
        </p>
        <button className={classes.ctaButton}>
          Get Started
        </button>
      </div>
    </section>
  );
};
