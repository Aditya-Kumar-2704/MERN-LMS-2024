import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Trophy,
  XCircle,
} from "lucide-react";
import { fetchStudentAssessmentResultService } from "@/services";

function formatDate(value) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDuration(seconds) {
  const total = Math.max(seconds || 0, 0);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function StudentAssessmentResultPage() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true);
        const response = await fetchStudentAssessmentResultService(resultId);
        if (response?.success) {
          setResult(response.data);
        }
      } catch (error) {
        alert(error?.response?.data?.message || "Unable to load result");
        navigate("/home");
      } finally {
        setLoading(false);
      }
    }

    if (resultId) {
      loadResult();
    }
  }, [navigate, resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06121f] px-4 py-16 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-[#d4a017]" />
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(212,160,23,0.16),transparent_24%),linear-gradient(180deg,#06121f_0%,#07182c_100%)] px-4 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[#d4a017]">
              {result.subject.code}
            </p>
            <h1 className="mt-2 text-3xl font-bold">{result.test.title}</h1>
            <p className="mt-2 text-slate-300">
              Submitted on {formatDate(result.submittedAt)}
              {location.state?.autoSubmitted ? " after auto-submit." : "."}
            </p>
          </div>

          <Button
            className="bg-[#d4a017] text-[#06121f] hover:bg-[#e1b84b]"
            onClick={() => navigate("/home")}
          >
            Back to dashboard
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-white/10 bg-[#0b1b2d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-slate-400">Score</p>
              <p className="mt-2 text-4xl font-bold">{result.scorePercentage}%</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-[#0b1b2d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-slate-400">Correct Answers</p>
              <p className="mt-2 text-4xl font-bold">
                {result.correctAnswers}/{result.totalQuestions}
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-[#0b1b2d] text-white">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d4a017] text-[#06121f]">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Time Used</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatDuration(result.timeSpentInSeconds)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-[#0b1b2d] text-white">
            <CardContent className="flex items-center gap-3 p-5">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  result.passed
                    ? "bg-emerald-400 text-[#072018]"
                    : "bg-rose-400 text-[#2a0d15]"
                }`}
              >
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Result</p>
                <p className="mt-1 text-2xl font-bold">
                  {result.passed ? "Passed" : "Needs review"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b1b2d] text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Answer review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.answers.map((answer, index) => (
              <div
                key={`${answer.questionId}-${index}`}
                className="rounded-3xl border border-white/10 bg-[#10253d] p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Question {index + 1}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold leading-7">
                      {answer.questionText}
                    </h2>
                  </div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                      answer.isCorrect
                        ? "bg-emerald-400/15 text-emerald-200"
                        : "bg-rose-400/15 text-rose-200"
                    }`}
                  >
                    {answer.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {answer.isCorrect ? "Correct" : "Incorrect"}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-[#0c2035] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Your answer
                    </p>
                    <p className="mt-2 text-base text-slate-100">
                      {answer.selectedOptionText || "Not answered"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                      Correct answer
                    </p>
                    <p className="mt-2 text-base text-white">
                      {answer.correctOptionText}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StudentAssessmentResultPage;
