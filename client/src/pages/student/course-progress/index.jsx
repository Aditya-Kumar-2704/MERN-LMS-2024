import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "@/components/video-player";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import {
  getCurrentCourseProgressService,
  listStudentExamsForCourseService,
  markLectureAsViewedService,
  resetCourseProgressService,
} from "@/services";
import { Check, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useNavigate, useParams } from "react-router-dom";

function getNextLecture(courseDetails, progress, completed) {
  const curriculum = courseDetails?.curriculum || [];

  if (!curriculum.length) {
    return null;
  }

  if (completed) {
    return curriculum[0];
  }

  const viewedLectureIds = new Set(
    (progress || [])
      .filter((item) => item?.viewed)
      .map((item) => String(item.lectureId))
  );

  return (
    curriculum.find((item) => !viewedLectureIds.has(String(item._id))) ||
    curriculum[curriculum.length - 1]
  );
}

function StudentViewCourseProgressPage() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { studentCurrentCourseProgress, setStudentCurrentCourseProgress } =
    useContext(StudentContext);
  const [lockCourse, setLockCourse] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [showCourseCompleteDialog, setShowCourseCompleteDialog] =
    useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const [courseExams, setCourseExams] = useState([]);
  const { id } = useParams();

  async function fetchCurrentCourseProgress() {
    try {
      const response = await getCurrentCourseProgressService(auth?.user?._id, id);

      if (!response?.success) {
        return;
      }

      if (!response?.data?.isPurchased) {
        setLockCourse(true);
        setCurrentLecture(null);
        setCourseExams([]);
        setStudentCurrentCourseProgress({});
        return;
      }

      setLockCourse(false);
      setStudentCurrentCourseProgress({
        courseDetails: response?.data?.courseDetails,
        progress: response?.data?.progress || [],
      });

      const examList = await listStudentExamsForCourseService(id);
      if (examList?.success) {
        setCourseExams(examList.data || []);
      } else {
        setCourseExams([]);
      }

      const nextLecture = getNextLecture(
        response?.data?.courseDetails,
        response?.data?.progress,
        response?.data?.completed
      );

      setCurrentLecture(nextLecture);

      if (response?.data?.completed) {
        setShowCourseCompleteDialog(true);
        setShowConfetti(true);
        return;
      }

      setShowCourseCompleteDialog(false);
      setShowConfetti(false);
    } catch (error) {
      console.error("Error fetching course progress:", error);
      setLockCourse(true);
      setCurrentLecture(null);
      setCourseExams([]);
    }
  }

  async function updateCourseProgress() {
    if (currentLecture) {
      const response = await markLectureAsViewedService(
        auth?.user?._id,
        studentCurrentCourseProgress?.courseDetails?._id,
        currentLecture._id
      );

      if (response?.success) {
        fetchCurrentCourseProgress();
      }
    }
  }

  async function handleRewatchCourse() {
    const response = await resetCourseProgressService(
      auth?.user?._id,
      studentCurrentCourseProgress?.courseDetails?._id
    );

    if (response?.success) {
      setCurrentLecture(null);
      setShowConfetti(false);
      setShowCourseCompleteDialog(false);
      fetchCurrentCourseProgress();
    }
  }

  useEffect(() => {
    fetchCurrentCourseProgress();
  }, [id]);

  useEffect(() => {
    if (currentLecture?.progressValue === 1) {
      updateCourseProgress();
    }
  }, [currentLecture]);

  useEffect(() => {
    if (!showConfetti) {
      return undefined;
    }

    const timer = setTimeout(() => setShowConfetti(false), 15000);

    return () => clearTimeout(timer);
  }, [showConfetti]);

  console.log(currentLecture, "currentLecture");

  return (
    <div className="flex flex-col h-screen bg-[#1c1d1f] text-white">
      {showConfetti && <Confetti />}
      <div className="flex items-center justify-between p-4 bg-[#1c1d1f] border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate("/student-courses")}
            className="text-black"
            variant="ghost"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to My Courses Page
          </Button>
          <h1 className="text-lg font-bold hidden md:block">
            {studentCurrentCourseProgress?.courseDetails?.title}
          </h1>
        </div>
        <Button onClick={() => setIsSideBarOpen(!isSideBarOpen)}>
          {isSideBarOpen ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`flex-1 ${
            isSideBarOpen ? "mr-[400px]" : ""
          } transition-all duration-300`}
        >
          <VideoPlayer
            width="100%"
            height="500px"
            url={currentLecture?.videoUrl}
            onProgressUpdate={setCurrentLecture}
            progressData={currentLecture}
          />
          <div className="p-6 bg-[#1c1d1f]">
            <h2 className="text-2xl font-bold mb-2">{currentLecture?.title}</h2>
          </div>
        </div>
        <div
          className={`fixed top-[64px] right-0 bottom-0 w-[400px] bg-[#1c1d1f] border-l border-gray-700 transition-all duration-300 ${
            isSideBarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <Tabs defaultValue="content" className="h-full flex flex-col">
            <TabsList className="grid bg-[#1c1d1f] w-full grid-cols-3 p-0 h-14">
              <TabsTrigger
                value="content"
                className=" text-black rounded-none h-full text-xs sm:text-sm"
              >
                Content
              </TabsTrigger>
              <TabsTrigger
                value="exams"
                className=" text-black rounded-none h-full text-xs sm:text-sm"
              >
                Exams
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className=" text-black rounded-none h-full text-xs sm:text-sm"
              >
                Overview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="content">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {studentCurrentCourseProgress?.courseDetails?.curriculum.map(
                    (item) => (
                      <div
                        className={`flex items-center space-x-2 rounded-md p-2 text-sm font-bold cursor-pointer transition-colors ${
                          currentLecture?._id === item._id
                            ? "bg-white/10 text-white"
                            : "text-white"
                        }`}
                        key={item._id}
                        onClick={() => setCurrentLecture(item)}
                      >
                        {studentCurrentCourseProgress?.progress?.find(
                          (progressItem) =>
                            String(progressItem.lectureId) === String(item._id)
                        )?.viewed ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Play className="h-4 w-4 " />
                        )}
                        <span>{item?.title}</span>
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="exams" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {courseExams.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No exams for this course yet.
                    </p>
                  ) : (
                    courseExams.map((ex) => (
                      <Button
                        key={ex._id}
                        variant="secondary"
                        className="w-full justify-start text-black h-auto py-3 flex flex-col items-start"
                        onClick={() =>
                          navigate(`/course/${id}/exam/${ex._id}`)
                        }
                      >
                        <span className="font-semibold">{ex.title}</span>
                        <span className="text-xs font-normal text-gray-600">
                          Pass at {ex.passingScorePercent}%
                        </span>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="overview" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <h2 className="text-xl font-bold mb-4">About this course</h2>
                  <p className="text-gray-400">
                    {studentCurrentCourseProgress?.courseDetails?.description}
                  </p>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Dialog open={lockCourse}>
        <DialogContent className="sm:w-[425px]">
          <DialogHeader>
            <DialogTitle>You can't view this page</DialogTitle>
            <DialogDescription>
              Please purchase this course to get access
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <Dialog open={showCourseCompleteDialog}>
        <DialogContent showOverlay={false} className="sm:w-[425px]">
          <DialogHeader>
            <DialogTitle>Congratulations!</DialogTitle>
            <DialogDescription className="flex flex-col gap-3">
              <Label>You have completed the course</Label>
              <div className="flex flex-row gap-3">
                <Button onClick={() => navigate("/student-courses")}>
                  My Courses Page
                </Button>
                <Button onClick={handleRewatchCourse}>Rewatch Course</Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentViewCourseProgressPage;
