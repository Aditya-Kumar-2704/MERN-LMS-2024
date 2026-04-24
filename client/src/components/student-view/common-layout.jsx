import { Link, Outlet, useLocation } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  PlayCircle,
  Trophy,
} from "lucide-react";
import StudentViewCommonHeader from "./header";

function StudentViewCommonLayout() {
  const location = useLocation();
  const hideChrome =
    location.pathname.includes("course-progress") ||
    location.pathname.includes("assessment/test");

  return (
    <div className="min-h-screen bg-[#040506] text-white">
      {!hideChrome ? <StudentViewCommonHeader /> : null}

      <Outlet />

      {!hideChrome ? (
        <footer className="border-t border-white/10 bg-black px-4 py-10 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 border-b border-white/10 pb-8 md:grid-cols-[1.2fr,0.8fr,0.8fr,1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-black shadow-md">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Vikash Classes Areraj
                    </h3>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Trusted Learning Hub
                    </p>
                  </div>
                </div>

                <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
                  Trusted teaching for board students and competition aspirants with
                  live classes, recorded support, tests, notes, and disciplined
                  guidance.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                    Board Courses
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                    Entrance Batches
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                    Free Tests
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
                  Quick Links
                </h4>
                <div className="mt-4 grid gap-3 text-sm text-slate-300">
                  <Link className="transition hover:text-amber-300" to="/home">
                    Home
                  </Link>
                  <Link className="transition hover:text-amber-300" to="/courses">
                    Courses
                  </Link>
                  <Link
                    className="transition hover:text-amber-300"
                    to="/student-courses"
                  >
                    Student Dashboard
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
                  Popular Programs
                </h4>
                <div className="mt-4 grid gap-3 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-300" />
                    <span>Class 10th</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-300" />
                    <span>Class 12th Arts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-300" />
                    <span>Navodaya and Sainik</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-300" />
                    <span>Super 30 and D.El.Ed</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
                  Start Learning
                </h4>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Explore courses, attend live classes, and take free MCQ tests
                  from one place.
                </p>
                <Link
                  to="/home#free-tests"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
                >
                  Open Free Tests
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <PlayCircle className="h-4 w-4" />
                  <span>Daily classes, notes, tests and revision support</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
              <p>
                Copyright {new Date().getFullYear()} Vikash Classes Areraj. All
                rights reserved.
              </p>
              <p>Built for disciplined board and entrance preparation.</p>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

export default StudentViewCommonLayout;
