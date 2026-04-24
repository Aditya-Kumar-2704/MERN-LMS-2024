import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StudentProfileSection from "@/components/student-view/profile-section";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import {
  fetchStudentBoughtCoursesService,
  fetchStudentLiveClassesService,
  fetchStudentPublishedResultsService,
} from "@/services";
import {
  BookOpen,
  FileText,
  GraduationCap,
  PlayCircle,
  Radio,
  UserRound,
  Watch,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const sidebarItems = [
  {
    id: "profile",
    label: "Profile",
    icon: UserRound,
    description: "Edit your image, roll number and info",
    enabled: true,
  },
  {
    id: "courses",
    label: "My Courses",
    icon: BookOpen,
    description: "Purchased courses and progress",
    enabled: true,
  },
  {
    id: "live-classes",
    label: "Live Classes",
    icon: Radio,
    description: "Join upcoming Jitsi sessions",
    enabled: true,
  },
  {
    id: "recordings",
    label: "Recorded Lectures",
    icon: PlayCircle,
    description: "Watch uploaded live-class recordings",
    enabled: true,
  },
  {
    id: "notes",
    label: "Notes",
    icon: FileText,
    description: "PDF notes will appear here",
    enabled: false,
  },
  {
    id: "results",
    label: "Results",
    icon: GraduationCap,
    description: "Published exam results",
    enabled: true,
  },
];

function getStatusClasses(status) {
  if (status === "live") {
    return "bg-red-100 text-red-700";
  }

  if (status === "upcoming") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "recorded") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-slate-200 text-slate-700";
}

function formatDateTime(value) {
  if (!value) return "Schedule not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Schedule not set";

  return date.toLocaleString();
}

function StudentCoursesPage() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { studentBoughtCoursesList, setStudentBoughtCoursesList } =
    useContext(StudentContext);
  const [liveClasses, setLiveClasses] = useState([]);
  const [publishedResults, setPublishedResults] = useState([]);
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(true);

  async function loadStudentDashboard() {
    if (!auth?.user?._id) return;

    try {
      setLoading(true);
      const [coursesResponse, liveClassesResponse, resultsResponse] =
        await Promise.all([
          fetchStudentBoughtCoursesService(auth.user._id),
          fetchStudentLiveClassesService(),
          fetchStudentPublishedResultsService(),
        ]);

      if (coursesResponse?.success) {
        setStudentBoughtCoursesList(coursesResponse.data || []);
      }

      if (liveClassesResponse?.success) {
        setLiveClasses(liveClassesResponse.data || []);
      }

      if (resultsResponse?.success) {
        setPublishedResults(resultsResponse.data || []);
      }
    } catch (error) {
      console.error("Student dashboard load error:", error);
      setStudentBoughtCoursesList([]);
      setLiveClasses([]);
      setPublishedResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudentDashboard();
  }, [auth?.user?._id]);

  const recordedLectures = liveClasses.filter(
    (liveClass) => Boolean(liveClass.recordingUrl)
  );
  const liveSessions = liveClasses.filter(
    (liveClass) => liveClass.status !== "recorded"
  );

  function renderCourses() {
    if (studentBoughtCoursesList.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No courses purchased yet.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {studentBoughtCoursesList.map((course) => (
          <Card key={course.courseId} className="overflow-hidden border-0 shadow-md">
            {course.courseImage ? (
              <img
                src={course.courseImage}
                alt={course.title}
                className="h-48 w-full object-cover"
              />
            ) : null}
            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-600">
                  {course.instructorName}
                </p>
              </div>
              <Button
                onClick={() => navigate(`/course-progress/${course.courseId}`)}
                className="w-full"
              >
                <Watch className="mr-2 h-4 w-4" />
                Start Learning
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  function renderLiveClasses() {
    if (liveSessions.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No live classes scheduled for your courses yet.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {liveSessions.map((liveClass) => (
          <Card key={liveClass._id} className="border-0 shadow-md">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                    {liveClass.courseTitle}
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {liveClass.title}
                  </h3>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                    liveClass.status
                  )}`}
                >
                  {liveClass.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>{liveClass.description || "Join the session using the Jitsi room below."}</p>
                <p>
                  <strong>Starts:</strong> {formatDateTime(liveClass.scheduledFor)}
                </p>
                <p>
                  <strong>Duration:</strong> {liveClass.durationMinutes} minutes
                </p>
                <p>
                  <strong>Instructor:</strong> {liveClass.instructorName}
                </p>
              </div>
              <Button asChild className="w-full">
                <a
                  href={liveClass.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Join Live Class
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  function renderRecordings() {
    if (recordedLectures.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Recorded lectures will appear here after your instructor uploads them.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {recordedLectures.map((recording) => (
          <Card key={recording._id} className="border-0 shadow-md">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                  {recording.courseTitle}
                </p>
                <h3 className="text-xl font-semibold text-slate-900">
                  {recording.title}
                </h3>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>{recording.description || "Recording uploaded after the live session."}</p>
                <p>
                  <strong>Recorded session:</strong>{" "}
                  {formatDateTime(recording.scheduledFor)}
                </p>
                <p>
                  <strong>Instructor:</strong> {recording.instructorName}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="flex-1">
                  <a
                    href={recording.recordingUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Watch Recording
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/course-progress/${recording.courseId}`)}
                >
                  Open Course
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  function renderResults() {
    if (publishedResults.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No published results yet.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {publishedResults.map((result) => (
          <Card key={result._id} className="border-0 shadow-md">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                    {result.courseTitle}
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {result.examTitle}
                  </h3>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    result.passed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {result.passed ? "Passed" : "Failed"}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <strong>Score:</strong> {result.scorePercent}%
                </p>
                <p>
                  <strong>Published:</strong> {formatDateTime(result.publishedAt)}
                </p>
                <p>
                  <strong>Source:</strong>{" "}
                  <span className="capitalize">{result.source}</span>
                </p>
                <p>
                  <strong>Remarks:</strong> {result.remarks || "No remarks"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  function renderMainContent() {
    if (loading) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Loading your dashboard...
          </CardContent>
        </Card>
      );
    }

    if (activeSection === "live-classes") {
      return renderLiveClasses();
    }

    if (activeSection === "recordings") {
      return renderRecordings();
    }

    if (activeSection === "results") {
      return renderResults();
    }

    if (activeSection === "profile") {
      return <StudentProfileSection />;
    }

    return renderCourses();
  }

  const activeItem =
    sidebarItems.find((item) => item.id === activeSection) || sidebarItems[0];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px,1fr]">
        <aside className="rounded-3xl bg-slate-900 p-5 text-white shadow-xl">
          <div className="border-b border-white/10 pb-5">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
              Student Dashboard
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              Welcome back, {auth?.user?.userName || "Student"}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Manage courses, join live classes, and revisit recordings from one place.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!item.enabled}
                onClick={() => item.enabled && setActiveSection(item.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  activeSection === item.id
                    ? "border-blue-400 bg-blue-500/20"
                    : "border-white/10 bg-white/5"
                } ${item.enabled ? "hover:bg-white/10" : "cursor-not-allowed opacity-50"}`}
              >
                <div className="flex items-start gap-3">
                  <item.icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{item.label}</p>
                      {!item.enabled ? (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                          Soon
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{item.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Courses</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {studentBoughtCoursesList.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Live Classes</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {liveSessions.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Recordings</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {recordedLectures.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Results</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {publishedResults.length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl text-slate-900">
                  {activeItem.label}
                </CardTitle>
                <p className="text-sm text-slate-500">{activeItem.description}</p>
              </div>
              {activeSection === "courses" ? (
                <Button variant="outline" onClick={() => navigate("/courses")}>
                  Explore More Courses
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>{renderMainContent()}</CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

export default StudentCoursesPage;
