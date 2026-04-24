import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AuthContext } from "@/context/auth-context";
import {
  fetchStudentExamService,
  getStudentLastExamAttemptService,
  submitStudentExamService,
} from "@/services";
import { ChevronLeft, Loader2, Clock } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function StudentCourseExamPage() {
  const { examId, courseId } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [lastAttempt, setLastAttempt] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [examRes, attemptRes] = await Promise.all([
          fetchStudentExamService(examId),
          getStudentLastExamAttemptService(examId),
        ]);
        if (examRes?.success) {
          setExam(examRes.data);
          setAnswers(
            (examRes.data?.questions || []).map(() => null)
          );
          setTimeLeft(examRes.data?.timeLimitPerQuestion || 60);
        }
        if (attemptRes?.success) setLastAttempt(attemptRes.data);
      } finally {
        setLoading(false);
      }
    }
    if (examId) load();
  }, [examId]);

  useEffect(() => {
    if (timeLeft > 0 && exam && !result) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam && !result) {
      // Time up for current question, move to next or submit
      if (currentQuestion < exam.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setTimeLeft(exam.timeLimitPerQuestion || 60);
      } else {
        // Last question, auto-submit if all answered
        if (!answers.some((a) => a === null || a === undefined)) {
          handleSubmit();
        }
      }
    }
  }, [timeLeft, exam, result, currentQuestion, answers]);

  async function handleSubmit() {
    if (answers.some((a) => a === null || a === undefined)) {
      alert("Answer every question before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitStudentExamService(examId, answers);
      if (res?.success) {
        setResult(res.data);
        const attemptRes = await getStudentLastExamAttemptService(examId);
        if (attemptRes?.success) setLastAttempt(attemptRes.data);
      } else {
        alert(res?.message || "Submit failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!auth?.authenticate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          className="text-blue-700"
          onClick={() => navigate(`/course-progress/${courseId}`)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to course
        </Button>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : !exam ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-600">
              Exam could not be loaded. You may need to purchase this course.
            </CardContent>
          </Card>
        ) : (
          <>
            {lastAttempt && !result ? (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="py-4 text-sm">
                  Last attempt: {lastAttempt.scorePercent}% —{" "}
                  {lastAttempt.passed ? "Passed" : "Not passed"} on{" "}
                  {new Date(lastAttempt.createdAt).toLocaleString()}
                </CardContent>
              </Card>
            ) : null}

            {result ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {result.passed ? "You passed" : "Not passed yet"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    Score: <strong>{result.scorePercent}%</strong> (pass at{" "}
                    {result.passingScorePercent}%)
                  </p>
                  <p className="text-gray-600">
                    Correct {result.correctCount} of {result.totalQuestions}
                  </p>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={() => navigate(`/course-progress/${courseId}`)}>
                      Back to lessons
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setResult(null);
                        setAnswers((exam?.questions || []).map(() => null));
                      }}
                    >
                      Retake
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{exam.title}</CardTitle>
                  {exam.description ? (
                    <p className="text-sm text-gray-600">{exam.description}</p>
                  ) : null}
                  <p className="text-sm text-gray-500">
                    Pass mark: {exam.passingScorePercent}%
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Question {currentQuestion + 1} of {exam.questions.length}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span className={timeLeft <= 10 ? "text-red-600 font-bold" : ""}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  {(() => {
                    const q = exam.questions[currentQuestion];
                    return (
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">
                          {currentQuestion + 1}. {q.prompt}
                        </Label>
                        <div className="space-y-2 pl-2">
                          {q.options.map((opt, oi) => (
                            <label
                              key={oi}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`q-${currentQuestion}`}
                                checked={answers[currentQuestion] === oi}
                                onChange={() => {
                                  const next = [...answers];
                                  next[currentQuestion] = oi;
                                  setAnswers(next);
                                }}
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      disabled={currentQuestion === 0}
                      onClick={() => {
                        setCurrentQuestion(currentQuestion - 1);
                        setTimeLeft(exam.timeLimitPerQuestion || 60);
                      }}
                    >
                      Previous
                    </Button>
                    {currentQuestion < exam.questions.length - 1 ? (
                      <Button
                        onClick={() => {
                          setCurrentQuestion(currentQuestion + 1);
                          setTimeLeft(exam.timeLimitPerQuestion || 60);
                        }}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        className="bg-blue-600"
                        disabled={submitting || answers.some((a) => a === null || a === undefined)}
                        onClick={handleSubmit}
                      >
                        {submitting ? "Submitting…" : "Submit answers"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default StudentCourseExamPage;
