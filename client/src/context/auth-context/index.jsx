import { Skeleton } from "@/components/ui/skeleton";
import { initialSignInFormData, initialSignUpFormData } from "@/config";
import { checkAuthService, loginService, registerService } from "@/services";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [signInFormData, setSignInFormData] = useState(initialSignInFormData);
  const [signUpFormData, setSignUpFormData] = useState(initialSignUpFormData);
  const [auth, setAuth] = useState({
    authenticate: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);

  function syncAuthSession(user, accessToken) {
    if (accessToken) {
      sessionStorage.setItem("accessToken", JSON.stringify(accessToken));
    }

    setAuth({
      authenticate: Boolean(user),
      user: user || null,
    });
  }

  // Redirect user to their dashboard based on role
  const redirectToRoleDashboard = (user) => {
    if (user?.role === "admin") {
      navigate("/admin");
    } else if (user?.role === "instructor") {
      navigate("/instructor");
    } else {
      navigate("/home");
    }
  };

  async function handleRegisterUser(event) {
    event.preventDefault();
    try {
      const data = await registerService(signUpFormData);
      if (data.success) {
        setSignUpFormData(initialSignUpFormData);
        alert("Registration successful! Please sign in with your credentials.");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert(error?.response?.data?.message || "An error occurred during registration");
    }
  }

  async function handleLoginUser(event) {
    event.preventDefault();
    try {
      const data = await loginService(signInFormData);
      console.log(data, "Login Response");

      if (data.success) {
        syncAuthSession(data.data.user, data.data.accessToken);
        // Redirect to appropriate dashboard based on role
        redirectToRoleDashboard(data.data.user);
      } else {
        alert(data.message || "Login failed");
        setAuth({
          authenticate: false,
          user: null,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(error?.response?.data?.message || "An error occurred during login. Check console.");
      setAuth({
        authenticate: false,
        user: null,
      });
    }
  }

  //check auth user

  async function checkAuthUser() {
    try {
      const data = await checkAuthService();
      if (data.success) {
        syncAuthSession(data.data.user);
        setLoading(false);
      } else {
        setAuth({
          authenticate: false,
          user: null,
        });
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      if (!error?.response?.data?.success) {
        setAuth({
          authenticate: false,
          user: null,
        });
        setLoading(false);
      }
    }
  }

  function resetCredentials() {
    setAuth({
      authenticate: false,
      user: null,
    });
  }

  useEffect(() => {
    checkAuthUser();
  }, []);

  console.log(auth, "gf");

  return (
    <AuthContext.Provider
      value={{
        signInFormData,
        setSignInFormData,
        signUpFormData,
        setSignUpFormData,
        handleRegisterUser,
        handleLoginUser,
        auth,
        syncAuthSession,
        resetCredentials,
      }}
    >
      {loading ? <Skeleton /> : children}
    </AuthContext.Provider>
  );
}
