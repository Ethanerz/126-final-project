import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout/Layout";
import AuthRedirect from "./components/AuthRedirect";
import Dashboard from "./components/Dashboard";
import Rating from "./components/Rating";
import Profile from "./components/Profile";
import Replies from "./components/Replies";
import NotFound from "./components/NotFound";
import MapRoute from "./components/MapRoute";

export const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            { path: "/", element: <Dashboard /> },
            { path: "/signup", element: <AuthRedirect mode="signup" /> },
            { path: "/signin", element: <AuthRedirect mode="signin" /> },
            { path: "/rating/:entityId", element: <Rating /> },
            { path: "/rating/:entityId/:reviewId", element: <Replies /> },
            { path: "/mappreview", element: <MapRoute /> },
            { path: "/profile", element: <Profile /> },
            { path: "*", element: <NotFound /> },
        ],
    },
]);
