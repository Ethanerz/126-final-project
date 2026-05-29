import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";
import Rating from "./components/Rating";
import MapPreview from "./components/mapPreview";
import Profile from "./components/Profile"
import Replies from "./components/Replies";

export const router  = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            {path: "/", element: <Dashboard />, },
            {path: "/signup", element: <Signup />, },
            {path: "/signin", element: <Signin />, },
            {path: "/rating/:entityId", element: <Rating />, },
            {path: "/mappreview", element: <MapPreview />, },
            {path: "/profile", element: <Profile/>},
            {path: "/rating/:entityId/:reviewId", element: <Replies /> },
        ],
    },
])