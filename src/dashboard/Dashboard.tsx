import { Calendar } from './components/Calendar/Calendar'
import HobbySurvey from './components/HobbySurvey/HobbySurvey';
import HobbySuggestion from './components/HobbySuggestion/HobbySuggestion';

const DashboardPage: React.FC = () => {
    return (
        <>
            <Calendar />
            <HobbySurvey />
            <HobbySuggestion />
        </>
    )
}

export default DashboardPage