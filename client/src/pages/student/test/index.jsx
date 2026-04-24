import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  fetchStudentAssessmentTestService,
  submitStudentAssessmentTestService,
} from "@/services";

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function StudentAssessmentTestPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [test, setTest] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const submitLockRef = useRef(false);

  async function loadTest() {
    try {
      setLoading(true);
      const response = await fetchStudentAssessmentTestService(testId);

      if (response?.success && response?.data?.alreadySubmitted) {
        navigate(`/assessment/result/${response.data.resultId}`, { replace: true });
        return;
      }

      if (response?.success) {
        setTest(response.data);
        setTimeLeft((response.data.durationInMinutes || 0) * 60);
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Unable to load this test");
      navigate("/home");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (testId) {
      loadTest();
    }
  }, [testId]);

  async function handleSubmit(autoSubmitted = false) {
    if (!test || submitting || submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);

    try {
      const payload = test.questions.map((question) => ({
        questionId: question._id,
        optionId: answers[question._id] || "",
      }));

      const response = await submitStudentAssessmentTestService(
        test._id,
        payload,
        Math.max(test.durationInMinutes * 60 - timeLeft, 0)
      );

      if (response?.success) {
        navigate(`/assessment/result/${response.data.resultId}`, {
          replace: true,
          state: { autoSubmitted },
        });
        return;
      }

      alert(response?.message || "Unable to submit the test");
      submitLockRef.current = false;
    } catch (error) {
      const existingResultId = error?.response?.data?.data?.resultId;
      if (existingResultId) {
        navigate(`/assessment/result/${existingResultId}`, { replace: true });
        return;
      }

      alert(error?.response?.data?.message || "Unable to submit the test");
      submitLockRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!test || loading || submitting || submitLockRef.current) {
      return undefined;
    }

    if (timeLeft <= 0) {
      handleSubmit(true);
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((previousTime) => previousTime - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [loading, submitting, test, timeLeft]);

  const currentQuestion = test?.questions?.[currentIndex];
  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06121f] px-4 py-16 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-[#d4a017]" />
        </div>
      </div>
    );
  }

  if (!test || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#06121f] px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl">
          <Card className="border-white/10 bg-[#0b1b2d] text-white">
            <CardContent className="py-14 text-center">
              <p className="text-lg text-slate-200">This test is not available.</p>
              <Button className="mt-6 bg-[#d4a017] text-[#06121f] hover:bg-[#e1b84b]" onClick={() => navigate("/home")}>
                Back to dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(212,160,23,0.18),transparent_24%),linear-gradient(180deg,#06121f_0%,#07182c_100%)] px-4 py-6 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Button
              variant="ghost"
              className="mb-3 px-0 text-slate-300 hover:bg-transparent hover:text-white"
              onClick={() => navigate("/home")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Button>
            <p className="text-sm uppercase tracking-[0.3em] text-[#d4a017]">
              {test.subject.code}
            </p>
            <h1 className="mt-2 text-3xl font-bold">{test.title}</h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              {test.description || "Answer the MCQs carefully. Your test will submit automatically when the timer reaches zero."}
            </p>
          </div>

          <Card className="border-[#d4a017]/30 bg-[#10253d] text-white shadow-xl shadow-black/20">
            <CardContent className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4a017] text-[#06121f]">
                <Clock3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Time Remaining
                </p>
                <p
                  className={`text-3xl font-bold ${
                    timeLeft <= 60 ? "text-rose-300" : "text-white"
                  }`}
                >
                  {formatTime(timeLeft)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr,0.9fr]">
          <Card className="border-white/10 bg-[#0b1b2d] text-white">
            <CardHeader className="border-b border-white/10">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                    Question {currentIndex + 1} of {test.questions.length}
                  </p>
                  <CardTitle className="mt-2 text-2xl leading-9">
                    {currentQuestion.questionText}
                  </CardTitle>
                </div>
                <div className="rounded-2xl border border-[#d4a017]/30 bg-[#11263e] px-4 py-3 text-sm text-slate-200">
                  Marks: <span className="font-semibold text-white">{currentQuestion.marks}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {currentQuestion.options.map((option, optionIndex) => {
                const selected = answers[currentQuestion._id] === option.optionId;

                return (
                  <label
                    key={option.optionId}
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border px-4 py-4 transition ${
                      selected
                        ? "border-[#d4a017] bg-[#132b46]"
                        : "border-white/10 bg-[#0f2237] hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion._id}
                      checked={selected}
                      onChange={() =>
                        setAnswers((previous) => ({
                          ...previous,
                          [currentQuestion._id]: option.optionId,
                        }))
                      }
                      className="mt-1 h-4 w-4 accent-[#d4a017]"
                    />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Option {optionIndex + 1}
                      </p>
                      <p className="mt-1 text-base leading-7 text-slate-100">
                        {option.text}
                      </p>
                    </div>
                  </label>
                );
              })}

              <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
                <Button
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((previous) => previous - 1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="outline"
                    className="border-[#d4a017]/40 bg-transparent text-[#f3d88d] hover:bg-[#d4a017]/10"
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit test"}
                  </Button>
                  <Button
                    className="bg-[#d4a017] text-[#06121f] hover:bg-[#e1b84b]"
                    disabled={currentIndex === test.questions.length - 1}
                    onClick={() => setCurrentIndex((previous) => previous + 1)}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-[#0b1b2d] text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShieldCheck className="h-5 w-5 text-[#d4a017]" />
                  Test status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-[#0f2237] p-4">
                    <p className="text-sm text-slate-400">Answered</p>
                    <p className="mt-1 text-3xl font-bold">{answeredCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#0f2237] p-4">
                    <p className="text-sm text-slate-400">Remaining</p>
                    <p className="mt-1 text-3xl font-bold">
                      {test.questions.length - answeredCount}
                    </p>
                  </div>
                </div>

                {test.instructions ? (
                  <div className="rounded-2xl border border-[#d4a017]/20 bg-[#11263e] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#d4a017]">
                      Instructions
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {test.instructions}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0b1b2d] text-white">
              <CardHeader>
                <CardTitle className="text-xl">Question palette</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-3">
                  {test.questions.map((question, index) => {
                    const selected = Boolean(answers[question._id]);
                    const active = index === currentIndex;

                    return (
                      <button
                        key={question._id}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                          active
                            ? "border-[#d4a017] bg-[#d4a017] text-[#06121f]"
                            : selected
                              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                              : "border-white/10 bg-[#0f2237] text-slate-300 hover:border-white/20"
                        }`}
                      >
                        {selected && !active ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentAssessmentTestPage;
