import AdminDashboard from "@/components/admin-view/dashboard";
import AdminExamsManager from "@/components/admin-view/exams-manager";
import AdminResultsManager from "@/components/admin-view/results-manager";
import AdminToppersManager from "@/components/admin-view/toppers-manager";
import AdminUsersManager from "@/components/admin-view/users-manager";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/auth-context";
import {
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  LogOut,
  Medal,
  Trophy,
  Users,
} from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const adminSections = [
  {
    id: "users",
    label: "Users",
    description: "Students and instructors",
    icon: Users,
  },
  {
    id: "mcq-tests",
    label: "MCQ Tests",
    description: "Subjects, questions, tests",
    icon: BookOpenCheck,
  },
  {
    id: "course-exams",
    label: "Course Exams",
    description: "Old exam module",
    icon: ClipboardList,
  },
  {
    id: "results",
    label: "Results",
    description: "Publish result sheets",
    icon: BarChart3,
  },
  {
    id: "toppers",
    label: "Toppers",
    description: "Institute toppers",
    icon: Trophy,
  },
];

function AdminPage() {
  const { resetCredentials } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState("users");

  function handleLogout() {
    resetCredentials();
    sessionStorage.clear();
  }

  const activeSectionMeta = useMemo(
    () =>
      adminSections.find((section) => section.id === activeSection) ||
      adminSections[0],
    [activeSection]
  );

  function renderActivePanel() {
    switch (activeSection) {
      case "users":
        return <AdminUsersManager />;
      case "mcq-tests":
        return <AdminDashboard />;
      case "course-exams":
        return <AdminExamsManager />;
      case "results":
        return <AdminResultsManager />;
      case "toppers":
        return <AdminToppersManager />;
      default:
        return <AdminUsersManager />;
    }
  }

  return (
    <div className="min-h-screen bg-[#06121f] text-white">
      <header className="border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(212,160,23,0.14),transparent_30%),linear-gradient(135deg,#081526_0%,#0c2238_100%)] p-6 shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-[#d4a017]">
              Vikash Classes
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Admin Control Panel
            </h1>
            <p className="mt-2 text-slate-300">
              Sidebar me purane admin tools aur naya MCQ test system dono available hain.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              className="border border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <Link to="/home">
                <Medal className="mr-2 h-4 w-4" />
                Student View
              </Link>
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-[#d4a017] text-[#06121f] hover:bg-[#e1b84b]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 lg:flex-row lg:p-6">
        <aside className="lg:sticky lg:top-6 lg:h-fit lg:w-80">
          <div className="rounded-[28px] border border-white/10 bg-[#0b1b2d] p-4 shadow-xl shadow-black/20">
            <div className="rounded-3xl border border-[#d4a017]/20 bg-[#10253d] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#d4a017]">
                Navigation
              </p>
              <h2 className="mt-3 text-2xl font-bold">Admin Sidebar</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Users, exams, results, toppers aur MCQ test system ek jagah se manage karo.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {adminSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-[#d4a017] bg-[#d4a017] text-[#06121f]"
                        : "border-white/10 bg-[#10253d] text-white hover:border-white/20 hover:bg-[#122c48]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${
                          isActive
                            ? "bg-[#06121f]/10 text-[#06121f]"
                            : "bg-white/5 text-[#d4a017]"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{section.label}</p>
                        <p
                          className={`mt-1 text-sm ${
                            isActive ? "text-[#06121f]/80" : "text-slate-400"
                          }`}
                        >
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-6 rounded-[28px] border border-white/10 bg-[#0b1b2d] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[#d4a017]">
              Current Section
            </p>
            <h2 className="mt-2 text-2xl font-bold">{activeSectionMeta.label}</h2>
            <p className="mt-2 text-sm text-slate-300">
              {activeSectionMeta.description}
            </p>
          </div>

          {renderActivePanel()}
        </main>
      </div>
    </div>
  );
}

export default AdminPage;
