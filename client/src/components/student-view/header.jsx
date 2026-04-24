import {
  GraduationCap,
  TvMinimalPlay,
  Menu,
  X,
  Home,
  BookOpen,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/auth-context";

function StudentViewCommonHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, resetCredentials } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    resetCredentials();
    sessionStorage.clear();
  }

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  const navigationItems = [
    {
      label: "Home",
      icon: Home,
      path: "/home",
    },
    {
      label: "Courses",
      icon: BookOpen,
      path: "/courses",
    },
    {
      label: "Dashboard",
      icon: TvMinimalPlay,
      path: "/student-courses",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 text-white shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link to="/home" className="group cursor-pointer">
          <div className="flex items-center gap-3 transition-transform duration-200 group-hover:scale-[1.02]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-black shadow-md">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-wide text-white md:text-xl">
                Vikash Classes
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Areraj
              </span>
            </div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
              className={`rounded-full px-4 py-2 font-medium transition-colors ${
                isActive(item.path)
                  ? "bg-amber-400 text-black hover:bg-amber-300"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Student
            </p>
            <p className="text-sm font-semibold text-white">
              {auth?.user?.userName || "Learner"}
            </p>
          </div>
          <Button
            onClick={handleLogout}
            className="rounded-full bg-white font-semibold text-black hover:bg-slate-200"
          >
            Sign Out
          </Button>
        </div>

        <button
          className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-white/10 bg-[#0b0f14] px-4 py-4 md:hidden">
          <div className="mx-auto max-w-7xl space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Student
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {auth?.user?.userName || "Learner"}
              </p>
            </div>

            {navigationItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full justify-start rounded-2xl px-4 py-6 ${
                  isActive(item.path)
                    ? "bg-amber-400 text-black hover:bg-amber-300"
                    : "bg-white/[0.03] text-white hover:bg-white/10"
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            ))}

            <Button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full rounded-2xl bg-white text-black hover:bg-slate-200"
            >
              Sign Out
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default StudentViewCommonHeader;
