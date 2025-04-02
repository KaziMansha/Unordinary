import classes from './Calendar.module.css'

export function Calendar() {
    return (
        <>
            <div className={classes.calendar}>
                <div className={'$classes.month-calendar $classes.month-calendar--five-week'}>
                   <ul className={'$classes.month-calendar__day-of-week-list'}>
                        <li className={'$classes.month-calendar__day-of-week'}>
                            {'Sunday'}
                        </li>
                        <li className={'$classes.month-calendar__day-of-week'}>
                            {'Monday'}
                        </li>
                        <li className={'$classes.month-calendar__day-of-week'}>
                            {'Tuesday'}
                        </li>
                        <li className={'$classes.month-calendar__day-of-week'}>
                            {'Wednesday'}
                        </li>
                        <li className={'$classes.month-calendar__day-of-week'}>
                            {'Thursday'}
                        </li>
                        <li className={'$classes.month-calendar__day-of-week'}>
                            {'Friday'}
                        </li>
                        <li className={'$classes.month-calendar__day-of-week'}>
                            {'Saturday'}
                        </li>
                   </ul>
                </div>
            </div>
        </>
    )
}