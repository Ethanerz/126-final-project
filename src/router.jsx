import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout/Layout";
import AuthRedirect from "./components/AuthRedirect";
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
            {path: "/signup", element: <AuthRedirect mode="signup" />, },
            {path: "/signin", element: <AuthRedirect mode="signin" />, },
            {path: "/rating/:entityId", element: <Rating />, },
            {path: "/mappreview", element: <MapPreview />, },
            {path: "/profile", element: <Profile/>},
            {path: "/rating/:entityId/:reviewId", element: <Replies /> },
        ],
    },
])