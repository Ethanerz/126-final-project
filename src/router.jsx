import { createBrowserRouter } from "react-router-dom";
import App from './App';
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";
import Rating from "./components/Rating";

export const router  = createBrowserRouter([
    {path: "/", element: <App />, },
    {path: "/signup", element: <Signup />, },
    {path: "/signin", element: <Signin />, },
    {path: "/dashboard", element: <Dashboard />, },
    {path: "/rating/:entityId", element: <Rating />, }
])