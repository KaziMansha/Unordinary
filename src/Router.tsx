//Don't change

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Routes } from './Routes.tsx'

const unordinaryRouter = createBrowserRouter(Routes)

export function Router() {
    return <RouterProvider router={unordinaryRouter} />
}