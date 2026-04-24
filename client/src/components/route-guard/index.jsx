import { Navigate, useLocation } from "react-router-dom";
import { Fragment } from "react";

function RouteGuard({ authenticated, user, element }) {
  const location = useLocation();
  const path = location.pathname;
  const role = user?.role;

  if (!authenticated && !path.includes("/auth")) {
    return <Navigate to="/auth" />;
  }

  if (authenticated && path.includes("/auth")) {
    if (role === "admin") {
      return <Navigate to="/admin" />;
    }

    if (role === "instructor") {
      return <Navigate to="/instructor" />;
    }

    return <Navigate to="/home" />;
  }

  if (authenticated && path.includes("/admin") && role !== "admin") {
    return <Navigate to={role === "instructor" ? "/instructor" : "/home"} />;
  }

  if (
    authenticated &&
    path.includes("/instructor") &&
    !["admin", "instructor"].includes(role)
  ) {
    return <Navigate to="/home" />;
  }

  return <Fragment>{element}</Fragment>;
}

export default RouteGuard;
