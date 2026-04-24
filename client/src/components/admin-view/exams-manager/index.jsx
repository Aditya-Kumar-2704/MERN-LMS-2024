import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createExamService,
  deleteExamService,
  fetchAdminExamByIdService,
  fetchAdminExamsForCourseService,
  fetchInstructorCourseListService,
  updateExamService,
} from "@/services";
import { ClipboardList, Plus, Trash2 } from "lucide-react";

const emptyQuestion = () => ({
  prompt: "",
  options: ["", "", "", ""],
  correctIndex: 0,
});

function AdminExamsManager() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScorePercent, setPassingScorePercent] = useState(60);
  const [timeLimitPerQuestion, setTimeLimitPerQuestion] = useState(60);
  const [questions, setQuestions] = useState([emptyQuestion()]);

  async function loadCourses() {
    const res = await fetchInstructorCourseListService();
    if (res?.success) setCourses(res.data || []);
  }

  async function loadExamsForCourse(cid) {
    if (!cid) {
      setExams([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchAdminExamsForCourseService(cid);
      if (res?.success) setExams(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadExamsForCourse(courseId);
  }, [courseId]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setPassingScorePercent(60);
    setTimeLimitPerQuestion(60);
    setQuestions([emptyQuestion()]);
  }

  async function handleEdit(examId) {
    const res = await fetchAdminExamByIdService(examId);
    if (!res?.success || !res.data) return;
    const e = res.data;
    setEditingId(examId);
    setTitle(e.title);
    setDescription(e.description || "");
    setPassingScorePercent(e.passingScorePercent ?? 60);
    setTimeLimitPerQuestion(e.timeLimitPerQuestion ?? 60);
    setQuestions(
      e.questions?.length
        ? e.questions.map((q) => ({
            prompt: q.prompt,
            options: [...q.options, "", "", "", ""].slice(0, 4),
            correctIndex: q.correctIndex,
          }))
        : [emptyQuestion()]
    );
  }

  function buildPayload() {
    const trimmed = questions.map((q) => ({
      prompt: q.prompt.trim(),
      options: q.options.map((o) => o.trim()).filter(Boolean),
      correctIndex: q.correctIndex,
    }));
    return {
      courseId,
      title: title.trim(),
      description: description.trim(),
      passingScorePercent: Number(passingScorePercent) || 60,
      timeLimitPerQuestion: Number(timeLimitPerQuestion) || 60,
      questions: trimmed.map((q) => {
        const options =
          q.options.length >= 2
            ? q.options
            : [...q.options, "", ""].slice(0, 4);
        let correctIndex = q.correctIndex;
        if (correctIndex >= options.length) correctIndex = 0;
        return { ...q, options, correctIndex };
      }),
    };
  }

  async function handleSave() {
    if (!courseId) {
      alert("Select a course");
      return;
    }
    const payload = buildPayload();
    if (!payload.title) {
      alert("Title is required");
      return;
    }
    const res = editingId
      ? await updateExamService(editingId, {
          title: payload.title,
          description: payload.description,
          passingScorePercent: payload.passingScorePercent,
          timeLimitPerQuestion: payload.timeLimitPerQuestion,
          questions: payload.questions,
        })
      : await createExamService(payload);
    if (res?.success) {
      resetForm();
      loadExamsForCourse(courseId);
    } else {
      alert(res?.message || "Save failed");
    }
  }

  async function handleDelete(examId) {
    if (!window.confirm("Delete this exam?")) return;
    const res = await deleteExamService(examId);
    if (res?.success) loadExamsForCourse(courseId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="h-8 w-8" />
          Course exams
        </h2>
        <p className="text-gray-600 mt-2">
          Build tests for a course. Students see them after they purchase.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select course</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="w-full max-w-md border rounded-md px-3 py-2"
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              resetForm();
            }}
          >
            <option value="">Choose a course…</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {courseId ? (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingId ? "Edit exam" : "Create exam"}</CardTitle>
              {editingId ? (
                <Button variant="outline" size="sm" onClick={resetForm}>
                  Cancel edit
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 1 checkpoint"
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Passing score (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={passingScorePercent}
                  onChange={(e) => setPassingScorePercent(e.target.value)}
                />
              </div>
              <div>
                <Label>Time limit per question (seconds)</Label>
                <Input
                  type="number"
                  min={10}
                  max={3600}
                  value={timeLimitPerQuestion}
                  onChange={(e) => setTimeLimitPerQuestion(e.target.value)}
                />
              </div>

              <div className="space-y-6">
                {questions.map((q, qi) => (
                  <div
                    key={qi}
                    className="border rounded-lg p-4 space-y-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Question {qi + 1}</span>
                      {questions.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setQuestions(questions.filter((_, i) => i !== qi))
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      ) : null}
                    </div>
                    <div>
                      <Label>Prompt</Label>
                      <Textarea
                        value={q.prompt}
                        onChange={(e) => {
                          const next = [...questions];
                          next[qi] = { ...next[qi], prompt: e.target.value };
                          setQuestions(next);
                        }}
                        rows={2}
                      />
                    </div>
                    {q.options.map((opt, oi) => (
                      <div key={oi}>
                        <Label>Option {oi + 1}</Label>
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const next = [...questions];
                            const opts = [...next[qi].options];
                            opts[oi] = e.target.value;
                            next[qi] = { ...next[qi], options: opts };
                            setQuestions(next);
                          }}
                        />
                      </div>
                    ))}
                    <div>
                      <Label>Correct option</Label>
                      <select
                        className="w-full border rounded-md px-3 py-2"
                        value={q.correctIndex}
                        onChange={(e) => {
                          const next = [...questions];
                          next[qi] = {
                            ...next[qi],
                            correctIndex: Number(e.target.value),
                          };
                          setQuestions(next);
                        }}
                      >
                        {[0, 1, 2, 3].map((i) => (
                          <option key={i} value={i}>
                            Option {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setQuestions([...questions, emptyQuestion()])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add question
              </Button>

              <Button onClick={handleSave} className="bg-purple-600">
                {editingId ? "Update exam" : "Create exam"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exams for this course ({exams.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading…</p>
              ) : exams.length === 0 ? (
                <p className="text-gray-500">No exams yet.</p>
              ) : (
                <ul className="space-y-2">
                  {exams.map((ex) => (
                    <li
                      key={ex._id}
                      className="flex items-center justify-between border rounded-md p-3"
                    >
                      <div>
                        <p className="font-medium">{ex.title}</p>
                        <p className="text-sm text-gray-500">
                          Pass at {ex.passingScorePercent}% ·{" "}
                          {ex.questions?.length || 0} questions
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(ex._id)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(ex._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

export default AdminExamsManager;
