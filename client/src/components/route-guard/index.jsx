import { Navigate, useLocation } from "react-router-dom";
import { Fragment } from "react";

function RouteGuard({ authenticated, user, element }) {
  const location = useLocation();
  const path = location.pathname;

  if (!authenticated && !path.includes("/auth")) {
    return <Navigate to="/auth" />;
  }

  if (authenticated && path.includes("/auth")) {
    return <Navigate to="/home" />;
  }

  if (authenticated && user?.role === "admin") {
    return <Fragment>{element}</Fragment>;
  }

  if (
    authenticated &&
    (path.includes("/admin") || path.includes("/instructor"))
  ) {
    return <Navigate to="/home" />;
  }

  return <Fragment>{element}</Fragment>;
}

export default RouteGuard;
