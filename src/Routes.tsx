// Import all routes in here so we can have client-side routing
import { HomePage } from './home/Home.page.tsx' 

export const Routes = [
    {
        path: '/',
        description: 'Home',
        element: <HomePage />,
    },
    {
        path: '*',
        description: '404 Not Found',
        element: <div>{'404: Webpage not Found'}</div>
    }
]