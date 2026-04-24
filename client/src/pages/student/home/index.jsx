import { courseCategories } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useContext, useEffect, useRef, useState } from "react";
import { StudentContext } from "@/context/student-context";
import {
  checkCoursePurchaseInfoService,
  fetchStudentAssessmentDashboardService,
  fetchStudentViewCourseListService,
  fetchToppersService,
} from "@/services";
import { AuthContext } from "@/context/auth-context";
import { useNavigate } from "react-router-dom";
import banner from "../../../../public/banner-img.png";
import {
  Award,
  BookOpen,
  FileText,
  PlayCircle,
  Star,
  Trophy,
  Users,
  Wallet,
  Wifi,
} from "lucide-react";

const stats = [
  {
    value: 500,
    suffix: "+",
    subtitle: "Quality Courses",
    icon: BookOpen,
  },
  {
    value: 50,
    suffix: "K+",
    subtitle: "Active Students",
    icon: Users,
  },
  {
    value: 98,
    suffix: "%",
    subtitle: "Success Rate",
    icon: Award,
  },
  {
    value: 4.8,
    suffix: "/5",
    decimals: 1,
    subtitle: "Student Rating",
    icon: Star,
  },
];

const trustHighlights = [
  {
    title: "30+ Years",
    subtitle: "Trusted institute in Areraj",
    icon: Award,
    iconWrapperClass: "bg-amber-400 text-black",
  },
  {
    title: "Board + Competition",
    subtitle: "Complete school and entrance preparation",
    icon: Trophy,
    iconWrapperClass: "bg-white text-black",
  },
  {
    title: "Free MCQ Tests",
    subtitle: "Attempt published tests without any payment",
    icon: PlayCircle,
    iconWrapperClass: "bg-emerald-400 text-black",
  },
];

const specialityCards = [
  {
    title: "Complete School Courses",
    label: "Board Preparation",
    icon: BookOpen,
    containerClass:
      "border-white/10 bg-gradient-to-br from-[#151922] via-[#11151c] to-[#191f2a]",
    iconWrapperClass: "bg-amber-400 text-black",
    dotClass: "bg-amber-400",
    points: [
      "Class 10th and 12th complete syllabus coverage with daily study support.",
      "Concept clarity with notes, revision, and chapter-wise practice.",
      "Easy to follow learning flow for board preparation.",
    ],
  },
  {
    title: "Special Competition Batches",
    label: "Entrance Focus",
    icon: Trophy,
    containerClass:
      "border-white/10 bg-gradient-to-br from-[#17130d] via-[#14110d] to-[#21180f]",
    iconWrapperClass: "bg-orange-400 text-black",
    dotClass: "bg-orange-400",
    points: [
      "Super 30, Navodaya, Sainik School, and D.El.Ed focused preparation.",
      "Mock tests and previous year question practice for exam readiness.",
      "Step-by-step coaching for serious aspirants.",
    ],
  },
  {
    title: "Notes, Assignments and Tests",
    label: "Practice Support",
    icon: FileText,
    containerClass:
      "border-white/10 bg-gradient-to-br from-[#16111e] via-[#13111a] to-[#1f1730]",
    iconWrapperClass: "bg-violet-400 text-black",
    dotClass: "bg-violet-400",
    points: [
      "Regular assignments for discipline and revision.",
      "PDF notes for every subject to support classroom learning.",
      "Now includes free MCQ tests for all logged-in students.",
    ],
  },
  {
    title: "Affordable Learning",
    label: "Trusted Value",
    icon: Wallet,
    containerClass:
      "border-white/10 bg-gradient-to-br from-[#1a1216] via-[#151114] to-[#22141a]",
    iconWrapperClass: "bg-rose-400 text-black",
    dotClass: "bg-rose-400",
    points: [
      "Budget-friendly courses with expert faculty guidance.",
      "Free MCQ test section available without any payment.",
      "Trusted institute experience with local support.",
    ],
  },
  {
    title: "Study Support",
    label: "Daily Practice",
    icon: Wifi,
    containerClass:
      "border-white/10 bg-gradient-to-br from-[#111820] via-[#10151c] to-[#162331]",
    iconWrapperClass: "bg-cyan-400 text-black",
    dotClass: "bg-cyan-400",
    points: [
      "Revision-friendly dashboard for practice and learning.",
      "Published tests open directly from the home page.",
      "Simple flow for classes, notes, and tests together.",
    ],
  },
];

const testimonials = [
  {
    name: "Anjali Kumari",
    course: "Class 10th Board Preparation",
    quote:
      "The teachers explain every chapter in a simple way. Live classes and revision support helped me stay consistent.",
  },
  {
    name: "Rohit Raj",
    course: "Navodaya Entrance Batch",
    quote:
      "Mock tests and practice questions really improved my confidence. The guidance is practical and helpful.",
  },
  {
    name: "Soni Kumari",
    course: "Class 12th Arts",
    quote:
      "History, Political Science, and English became easier for me here. The faculty is very supportive.",
  },
];

function AnimatedCount({ value, suffix = "", decimals = 0, duration = 1400 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || shouldAnimate) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldAnimate]);

  useEffect(() => {
    if (!shouldAnimate) {
      return undefined;
    }

    let animationFrame;
    let startTime;

    function animate(timestamp) {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(value * progress);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    }

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [duration, shouldAnimate, value]);

  const formattedValue = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(displayValue);

  return (
    <span ref={elementRef}>
      {formattedValue}
      {suffix}
    </span>
  );
}

function StudentHomePage() {
  const { studentViewCoursesList, setStudentViewCoursesList } =
    useContext(StudentContext);
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [toppers, setToppers] = useState([]);
  const [assessmentDashboard, setAssessmentDashboard] = useState({
    subjects: [],
    tests: [],
    recentResults: [],
  });

  function handleNavigateToCoursesPage(getCurrentId) {
    sessionStorage.removeItem("filters");
    const currentFilter = {
      category: [getCurrentId],
    };
    sessionStorage.setItem("filters", JSON.stringify(currentFilter));
    navigate("/courses");
  }

  async function fetchAllStudentViewCourses() {
    const response = await fetchStudentViewCourseListService();
    if (response?.success) {
      setStudentViewCoursesList(response?.data);
    }
  }

  async function fetchToppers() {
    const response = await fetchToppersService();
    if (response?.success) {
      setToppers(response?.data || []);
    }
  }

  async function fetchFreeTests() {
    const response = await fetchStudentAssessmentDashboardService();
    if (response?.success) {
      setAssessmentDashboard(response.data);
    }
  }

  async function handleCourseNavigate(getCurrentCourseId) {
    const response = await checkCoursePurchaseInfoService(
      getCurrentCourseId,
      auth?.user?._id
    );

    if (response?.success) {
      if (response?.data) {
        navigate(`/course-progress/${getCurrentCourseId}`);
      } else {
        navigate(`/course/details/${getCurrentCourseId}`);
      }
    }
  }

  function handleTestNavigate(test) {
    if (test.attempted && test.resultId) {
      navigate(`/assessment/result/${test.resultId}`);
      return;
    }

    navigate(`/assessment/test/${test._id}`);
  }

  useEffect(() => {
    fetchAllStudentViewCourses();
    fetchToppers();
    fetchFreeTests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#040506] via-[#0a0d12] to-[#040506] text-white">
      <section className="border-b border-white/10 bg-gradient-to-br from-black via-[#0f131a] to-[#171d27] px-4 py-12 md:py-20 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div>
            <p className="text-xl font-semibold uppercase tracking-[0.25em] text-amber-300">
              Vikash Classes Areraj
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
              Disciplined and focused learning for board and competition
              preparation.
            </h1>
            <p className="mt-4 text-lg text-slate-300 md:text-xl">
              Learn with expert teaching, trusted guidance, and now access free
              MCQ tests directly from your student home page.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                onClick={() => navigate("/courses")}
                className="bg-amber-400 px-8 py-3 text-lg font-bold text-black hover:bg-amber-300"
              >
                Explore All Courses
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/home#free-tests")}
                className="border-white/15 bg-white/[0.04] px-8 py-3 text-lg text-white hover:bg-white hover:text-black"
              >
                Free Tests
              </Button>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-3 shadow-2xl">
              <img
                src={banner}
                alt="Vikash Classes Banner"
                className="h-auto w-full rounded-[24px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0c1016] px-4 py-12 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((item) => (
            <Card
              key={item.subtitle}
              className="rounded-3xl border-white/10 bg-white/[0.03] text-white shadow-sm"
            >
              <CardContent className="p-6 text-center">
                <item.icon className="mx-auto mb-3 h-12 w-12 text-amber-400" />
                <h3 className="text-3xl font-bold text-white">
                  <AnimatedCount
                    value={item.value}
                    suffix={item.suffix}
                    decimals={item.decimals || 0}
                  />
                </h3>
                <p className="mt-1 text-slate-400">{item.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-[#080b10] px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
            Choose Your Learning Path
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-lg text-slate-400">
            Courses designed for students at different academic levels.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 md:gap-4">
            {courseCategories.map((categoryItem) => (
              <Button
                key={categoryItem.id}
                onClick={() => handleNavigateToCoursesPage(categoryItem.id)}
                className="h-auto border border-white/10 bg-white/[0.04] py-6 text-center font-semibold text-white transition-all hover:bg-white hover:text-black"
              >
                {categoryItem.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0d1117] px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Featured Courses
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Handpicked courses to accelerate your learning journey.
          </p>

          {studentViewCoursesList && studentViewCoursesList.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {studentViewCoursesList.slice(0, 8).map((courseItem) => (
                <div
                  key={courseItem?._id}
                  onClick={() => handleCourseNavigate(courseItem?._id)}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-800">
                    <img
                      src={courseItem?.image}
                      alt={courseItem?.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">
                      {courseItem?.title}
                    </h3>
                    <p className="mb-3 text-sm font-medium text-amber-300">
                      {courseItem?.instructorName}
                    </p>
                    <p className="text-xl font-bold text-amber-300">
                      Rs. {courseItem?.pricing}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-lg text-slate-300">No courses available yet</p>
            </div>
          )}
        </div>
      </section>

      <section id="free-tests" className="bg-gradient-to-b from-[#080b10] via-[#0d1117] to-[#080b10] px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
              Test Section
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              Free MCQ Tests For All Students
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-400">
              Admin dashboard me jo published tests banenge wahi yahan show honge.
              In tests ko attempt karne ke liye koi payment ya course purchase
              required nahi hai.
            </p>
          </div>

          {assessmentDashboard.tests.length === 0 ? (
            <Card className="mx-auto mt-10 max-w-3xl rounded-[28px] border-white/10 bg-white/[0.03] text-white">
              <CardContent className="py-12 text-center">
                <p className="text-lg text-slate-300">
                  Abhi koi published free test available nahi hai.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {assessmentDashboard.tests.map((test) => (
                <Card
                  key={test._id}
                  className="rounded-[28px] border-white/10 bg-gradient-to-br from-[#151a22] via-[#10151c] to-[#171d27] text-white shadow-sm"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-amber-300">
                          {test.subject.code}
                        </p>
                        <h3 className="mt-2 text-xl font-bold">{test.title}</h3>
                      </div>
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                        Free
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-300">
                      {test.description ||
                        "Timed MCQ assessment with shuffled questions and options."}
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
                        <p className="text-xs text-slate-400">Questions</p>
                        <p className="mt-1 text-xl font-bold">{test.totalQuestions}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
                        <p className="text-xs text-slate-400">Timer</p>
                        <p className="mt-1 text-xl font-bold">
                          {test.durationInMinutes}m
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
                        <p className="text-xs text-slate-400">Pass</p>
                        <p className="mt-1 text-xl font-bold">
                          {test.passPercentage}%
                        </p>
                      </div>
                    </div>

                    {test.attempted ? (
                      <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                        Attempted already. Score: {test.scorePercentage}%.
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                        This test is free. Click below and start immediately.
                      </div>
                    )}

                    <Button
                      onClick={() => handleTestNavigate(test)}
                      className="mt-6 w-full bg-amber-400 font-semibold text-black hover:bg-amber-300"
                    >
                      {test.attempted ? (
                        "View Result"
                      ) : (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Attempt Free Test
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#080b10] via-[#0d1117] to-[#080b10] px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 p-8 shadow-2xl md:p-10">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-400/10 blur-2xl" />
              <div className="absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-white/5 blur-3xl" />
              <div className="relative">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
                  About Vikash Classes
                </p>
                <h2 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
                  Building strong foundations for school students and competition
                  aspirants
                </h2>
                <p className="mt-5 text-lg leading-7 text-slate-300">
                  Vikash Classes provides complete syllabus coverage, concept
                  clarity, regular practice, and affordable learning support for
                  students who want steady progress and real results.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {trustHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-sm"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconWrapperClass}`}
                  >
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {specialityCards.map((card) => (
              <div
                key={card.title}
                className={`rounded-[28px] border p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 ${card.containerClass}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${card.iconWrapperClass}`}
                  >
                    <card.icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {card.label}
                  </span>
                </div>
                <h4 className="mt-5 text-2xl font-bold text-white">{card.title}</h4>
                <div className="mt-5 space-y-3">
                  {card.points.map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-3 rounded-2xl bg-black/20 px-4 py-3 text-sm leading-6 text-slate-300 shadow-sm"
                    >
                      <span
                        className={`mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full ${card.dotClass}`}
                      />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {toppers && toppers.length > 0 ? (
        <section className="bg-gradient-to-r from-[#100d06] via-[#17120c] to-[#120d08] px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 flex items-center justify-center gap-3 text-3xl font-bold text-white md:text-4xl">
                <Trophy className="h-10 w-10 text-yellow-500" />
                Our Institute Toppers
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {toppers.map((topper) => (
                <div
                  key={topper._id}
                  className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-lg transition-shadow hover:shadow-xl"
                >
                  <div className="flex h-72 w-full items-center justify-center overflow-hidden bg-slate-800">
                    <img
                      src={topper.image}
                      alt={topper.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-6 text-center">
                    <h3 className="mb-2 text-xl font-bold text-white">{topper.name}</h3>
                    <p className="mb-1 font-semibold text-amber-300">
                      Roll No: {topper.rollno}
                    </p>
                    <p className="mb-2 text-slate-400">Year: {topper.year}</p>
                    <div className="flex justify-center">
                      <span className="rounded-full bg-amber-400/10 px-3 py-1 text-lg font-bold text-amber-300">
                        Marks: {topper.marks}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-[#0b0f14] px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
              Student Reviews
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              What students say about Vikash Classes
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {testimonials.map((item) => (
              <Card
                key={item.name}
                className="rounded-[28px] border-white/10 bg-gradient-to-br from-[#151a22] via-[#10151c] to-[#171d27] text-white shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, index) => (
                      <Star key={`${item.name}-${index}`} className="h-4 w-4 fill-current" />
                    ))}
                  </div>

                  <p className="mt-5 text-base leading-7 text-slate-300">
                    "{item.quote}"
                  </p>

                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-white">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{item.course}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-black via-slate-950 to-neutral-900 px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to Succeed?</h2>
          <p className="mb-8 mt-4 text-lg text-slate-300">
            Start your learning journey today with Vikash Classes Areraj and take
            free MCQ tests anytime.
          </p>
          <Button
            onClick={() => navigate("/home#free-tests")}
            className="bg-amber-400 px-8 py-3 text-lg font-bold text-black hover:bg-amber-300"
          >
            Start Free Tests
          </Button>
        </div>
      </section>
    </div>
  );
}

export default StudentHomePage;
