import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  ClipboardList,
  FileQuestion,
  LayoutDashboard,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  createAssessmentQuestionService,
  createAssessmentSubjectService,
  createAssessmentTestService,
  deleteAssessmentQuestionService,
  deleteAssessmentSubjectService,
  deleteAssessmentTestService,
  fetchAssessmentQuestionsService,
  fetchAssessmentSubjectsService,
  fetchAssessmentSummaryService,
  fetchAssessmentTestsService,
  updateAssessmentQuestionService,
  updateAssessmentSubjectService,
  updateAssessmentTestService,
} from "@/services";

const initialSubjectForm = {
  name: "",
  code: "",
  description: "",
  isActive: true,
};

const initialQuestionForm = {
  subject: "",
  questionText: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  marks: 1,
  isActive: true,
};

const initialTestForm = {
  subject: "",
  title: "",
  description: "",
  instructions: "",
  durationInMinutes: 30,
  passPercentage: 40,
  isPublished: true,
  questions: [],
};

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    subjectCount: 0,
    questionCount: 0,
    testCount: 0,
    resultCount: 0,
    publishedTests: [],
  });
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [tests, setTests] = useState([]);
  const [subjectForm, setSubjectForm] = useState(initialSubjectForm);
  const [questionForm, setQuestionForm] = useState(initialQuestionForm);
  const [testForm, setTestForm] = useState(initialTestForm);
  const [editingSubjectId, setEditingSubjectId] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [editingTestId, setEditingTestId] = useState("");
  const [questionFilterSubject, setQuestionFilterSubject] = useState("all");
  const [testFilterSubject, setTestFilterSubject] = useState("all");

  async function loadAdminData() {
    try {
      setLoading(true);
      const [summaryResponse, subjectResponse, questionResponse, testResponse] =
        await Promise.all([
          fetchAssessmentSummaryService(),
          fetchAssessmentSubjectsService(),
          fetchAssessmentQuestionsService(),
          fetchAssessmentTestsService(),
        ]);

      if (summaryResponse?.success) {
        setSummary(summaryResponse.data);
      }
      if (subjectResponse?.success) {
        setSubjects(subjectResponse.data || []);
      }
      if (questionResponse?.success) {
        setQuestions(questionResponse.data || []);
      }
      if (testResponse?.success) {
        setTests(testResponse.data || []);
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (!questionForm.subject && subjects[0]?._id) {
      setQuestionForm((previous) => ({ ...previous, subject: subjects[0]._id }));
    }

    if (!testForm.subject && subjects[0]?._id) {
      setTestForm((previous) => ({ ...previous, subject: subjects[0]._id }));
    }
  }, [questionForm.subject, subjects, testForm.subject]);

  const filteredQuestions = useMemo(() => {
    if (questionFilterSubject === "all") {
      return questions;
    }

    return questions.filter((question) => question.subject?._id === questionFilterSubject);
  }, [questionFilterSubject, questions]);

  const filteredTests = useMemo(() => {
    if (testFilterSubject === "all") {
      return tests;
    }

    return tests.filter((test) => test.subject?._id === testFilterSubject);
  }, [testFilterSubject, tests]);

  const availableQuestionsForTest = useMemo(
    () => questions.filter((question) => question.subject?._id === testForm.subject),
    [questions, testForm.subject]
  );

  function resetSubjectForm() {
    setSubjectForm(initialSubjectForm);
    setEditingSubjectId("");
  }

  function resetQuestionForm() {
    setQuestionForm({
      ...initialQuestionForm,
      subject: subjects[0]?._id || "",
    });
    setEditingQuestionId("");
  }

  function resetTestForm() {
    setTestForm({
      ...initialTestForm,
      subject: subjects[0]?._id || "",
    });
    setEditingTestId("");
  }

  async function handleSaveSubject() {
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
      alert("Subject name and code are required");
      return;
    }

    const response = editingSubjectId
      ? await updateAssessmentSubjectService(editingSubjectId, subjectForm)
      : await createAssessmentSubjectService(subjectForm);

    if (response?.success) {
      resetSubjectForm();
      loadAdminData();
      return;
    }

    alert(response?.message || "Unable to save subject");
  }

  async function handleDeleteSubject(subjectId) {
    if (!window.confirm("Delete this subject and all its questions, tests, and results?")) {
      return;
    }

    const response = await deleteAssessmentSubjectService(subjectId);
    if (response?.success) {
      if (editingSubjectId === subjectId) {
        resetSubjectForm();
      }
      loadAdminData();
      return;
    }

    alert(response?.message || "Unable to delete subject");
  }

  async function handleSaveQuestion() {
    if (!questionForm.subject || !questionForm.questionText.trim()) {
      alert("Select a subject and enter the question text");
      return;
    }

    const response = editingQuestionId
      ? await updateAssessmentQuestionService(editingQuestionId, questionForm)
      : await createAssessmentQuestionService(questionForm);

    if (response?.success) {
      resetQuestionForm();
      loadAdminData();
      return;
    }

    alert(response?.message || "Unable to save question");
  }

  async function handleDeleteQuestion(questionId) {
    if (!window.confirm("Delete this question from the bank?")) {
      return;
    }

    const response = await deleteAssessmentQuestionService(questionId);
    if (response?.success) {
      if (editingQuestionId === questionId) {
        resetQuestionForm();
      }
      loadAdminData();
      return;
    }

    alert(response?.message || "Unable to delete question");
  }

  async function handleSaveTest() {
    if (!testForm.subject || !testForm.title.trim()) {
      alert("Select a subject and enter a test title");
      return;
    }

    if (!testForm.questions.length) {
      alert("Select at least one question for the test");
      return;
    }

    // Warn if test is not being published
    if (!testForm.isPublished) {
      const confirmPublish = window.confirm(
        "This test is in DRAFT mode and will NOT be visible to students.\n\nDo you want to proceed?\n\nClick 'OK' to save as draft, or 'Cancel' to go back and check the 'Publish test' checkbox."
      );
      if (!confirmPublish) {
        return;
      }
    }

    const response = editingTestId
      ? await updateAssessmentTestService(editingTestId, testForm)
      : await createAssessmentTestService(testForm);

    if (response?.success) {
      resetTestForm();
      loadAdminData();
      return;
    }

    alert(response?.message || "Unable to save test");
  }

  async function handleDeleteTest(testId) {
    if (!window.confirm("Delete this test and every submitted result for it?")) {
      return;
    }

    const response = await deleteAssessmentTestService(testId);
    if (response?.success) {
      if (editingTestId === testId) {
        resetTestForm();
      }
      loadAdminData();
      return;
    }

    alert(response?.message || "Unable to delete test");
  }

  function renderOverview() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Subjects",
              value: summary.subjectCount,
              icon: BookOpen,
            },
            {
              label: "Question Bank",
              value: summary.questionCount,
              icon: FileQuestion,
            },
            {
              label: "Published Tests",
              value: summary.testCount,
              icon: ClipboardList,
            },
            {
              label: "Results Submitted",
              value: summary.resultCount,
              icon: LayoutDashboard,
            },
          ].map((item) => (
            <Card key={item.label} className="border-white/10 bg-[#10253d] text-white">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-3 text-4xl font-bold">{item.value}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#d4a017] text-[#06121f]">
                  <item.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-white/10 bg-[#0b1b2d] text-white">
          <CardHeader>
            <CardTitle>Latest published tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.publishedTests.length === 0 ? (
              <p className="text-slate-300">No tests created yet.</p>
            ) : (
              summary.publishedTests.map((test) => (
                <div
                  key={test._id}
                  className="rounded-3xl border border-white/10 bg-[#10253d] p-5"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-[#d4a017]">
                        {test.subject?.code}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold">{test.title}</h3>
                      <p className="mt-2 text-sm text-slate-300">
                        {test.questionCount} questions - {test.durationInMinutes} minutes - pass mark{" "}
                        {test.passPercentage}%
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        test.isPublished
                          ? "bg-emerald-400/15 text-emerald-200"
                          : "bg-slate-500/20 text-slate-200"
                      }`}
                    >
                      {test.isPublished ? "Published" : "Draft"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-[#d4a017]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(212,160,23,0.18),transparent_26%),linear-gradient(135deg,#0b1b2d_0%,#10253d_100%)] p-8 text-white">
        <p className="text-sm uppercase tracking-[0.35em] text-[#d4a017]">
          Assessment Control Center
        </p>
        <h2 className="mt-4 text-4xl font-bold">Build the MCQ system from one place</h2>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
          Create subjects, maintain the question bank, and publish timed tests that students can attempt from their dashboard.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-4 border border-white/10 bg-[#0b1b2d] p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverview()}</TabsContent>

        <TabsContent value="subjects" className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
          <Card className="border-white/10 bg-[#0b1b2d] text-white">
            <CardHeader>
              <CardTitle>{editingSubjectId ? "Edit subject" : "Create subject"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Subject name</Label>
                <Input
                  value={subjectForm.name}
                  onChange={(event) =>
                    setSubjectForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  className="mt-2 border-white/10 bg-[#10253d] text-white"
                />
              </div>
              <div>
                <Label>Subject code</Label>
                <Input
                  value={subjectForm.code}
                  onChange={(event) =>
                    setSubjectForm((previous) => ({
                      ...previous,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  className="mt-2 border-white/10 bg-[#10253d] text-white"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={subjectForm.description}
                  onChange={(event) =>
                    setSubjectForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-[120px] border-white/10 bg-[#10253d] text-white"
                />
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#10253d] px-4 py-3">
                <input
                  type="checkbox"
                  checked={subjectForm.isActive}
                  onChange={(event) =>
                    setSubjectForm((previous) => ({
                      ...previous,
                      isActive: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#d4a017]"
                />
                <span className="text-sm text-slate-200">Subject is active</span>
              </label>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-[#d4a017] text-[#06121f] hover:bg-[#e1b84b]"
                  onClick={handleSaveSubject}
                >
                  {editingSubjectId ? "Update subject" : "Create subject"}
                </Button>
                {editingSubjectId ? (
                  <Button
                    variant="outline"
                    className="border-white/15 bg-transparent text-white hover:bg-white/10"
                    onClick={resetSubjectForm}
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b1b2d] text-white">
            <CardHeader>
              <CardTitle>All subjects ({subjects.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjects.map((subject) => (
                <div
                  key={subject._id}
                  className="rounded-3xl border border-white/10 bg-[#10253d] p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-[#d4a017]">
                        {subject.code}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold">{subject.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {subject.description || "No description added yet."}
                      </p>
                      <p className="mt-3 text-sm text-slate-400">
                        Tests: {subject.testCount} - {subject.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-white/15 bg-transparent text-white hover:bg-white/10"
                        onClick={() => {
                          setEditingSubjectId(subject._id);
                          setSubjectForm({
                            name: subject.name,
                            code: subject.code,
                            description: subject.description,
                            isActive: subject.isActive,
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteSubject(subject._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <Card className="border-white/10 bg-[#0b1b2d] text-white">
            <CardHeader>
              <CardTitle>{editingQuestionId ? "Edit question" : "Add question"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Subject</Label>
                <select
                  value={questionForm.subject}
                  onChange={(event) =>
                    setQuestionForm((previous) => ({
                      ...previous,
                      subject: event.target.value,
                    }))
                  }
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#10253d] px-3 text-white"
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Question text</Label>
                <Textarea
                  value={questionForm.questionText}
                  onChange={(event) =>
                    setQuestionForm((previous) => ({
                      ...previous,
                      questionText: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-[120px] border-white/10 bg-[#10253d] text-white"
                />
              </div>
              {questionForm.options.map((option, index) => (
                <div key={index}>
                  <Label>Option {index + 1}</Label>
                  <Input
                    value={option}
                    onChange={(event) =>
                      setQuestionForm((previous) => {
                        const nextOptions = [...previous.options];
                        nextOptions[index] = event.target.value;
                        return { ...previous, options: nextOptions };
                      })
                    }
                    className="mt-2 border-white/10 bg-[#10253d] text-white"
                  />
                </div>
              ))}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Correct option</Label>
                  <select
                    value={questionForm.correctOptionIndex}
                    onChange={(event) =>
                      setQuestionForm((previous) => ({
                        ...previous,
                        correctOptionIndex: Number(event.target.value),
                      }))
                    }
                    className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#10253d] px-3 text-white"
                  >
                    {[0, 1, 2, 3].map((index) => (
                      <option key={index} value={index}>
                        Option {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Marks</Label>
                  <Input
                    type="number"
                    min={1}
                    value={questionForm.marks}
                    onChange={(event) =>
                      setQuestionForm((previous) => ({
                        ...previous,
                        marks: Number(event.target.value) || 1,
                      }))
                    }
                    className="mt-2 border-white/10 bg-[#10253d] text-white"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-[#d4a017] text-[#06121f] hover:bg-[#e1b84b]"
                  onClick={handleSaveQuestion}
                >
                  {editingQuestionId ? "Update question" : "Save question"}
                </Button>
                {editingQuestionId ? (
                  <Button
                    variant="outline"
                    className="border-white/15 bg-transparent text-white hover:bg-white/10"
                    onClick={resetQuestionForm}
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b1b2d] text-white">
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle>Question bank ({filteredQuestions.length})</CardTitle>
                <select
                  value={questionFilterSubject}
                  onChange={(event) => setQuestionFilterSubject(event.target.value)}
                  className="h-11 rounded-md border border-white/10 bg-[#10253d] px-3 text-white"
                >
                  <option value="all">All subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredQuestions.map((question, index) => (
                <div
                  key={question._id}
                  className="rounded-3xl border border-white/10 bg-[#10253d] p-5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d4a017]">
                    {question.subject?.code} - Question {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold leading-7">
                    {question.questionText}
                  </h3>
                  <div className="mt-4 grid gap-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={`${question._id}-${optionIndex}`}
                        className={`rounded-2xl border px-4 py-3 text-sm ${
                          question.correctOptionIndex === optionIndex
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                            : "border-white/10 bg-[#0f2237] text-slate-300"
                        }`}
                      >
                        Option {optionIndex + 1}: {option}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="border-white/15 bg-transparent text-white hover:bg-white/10"
                      onClick={() => {
                        setEditingQuestionId(question._id);
                        setQuestionForm({
                          subject: question.subject?._id || "",
                          questionText: question.questionText,
                          options: [...question.options, "", "", "", ""].slice(0, 4),
                          correctOptionIndex: question.correctOptionIndex,
                          marks: question.marks || 1,
                          isActive: question.isActive,
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteQuestion(question._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <Card className="border-white/10 bg-[#0b1b2d] text-white">
            <CardHeader>
              <CardTitle>{editingTestId ? "Edit test" : "Create test"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Subject</Label>
                <select
                  value={testForm.subject}
                  onChange={(event) =>
                    setTestForm((previous) => ({
                      ...previous,
                      subject: event.target.value,
                      questions: previous.questions.filter((questionId) =>
                        questions.some(
                          (question) =>
                            question._id === questionId &&
                            question.subject?._id === event.target.value
                        )
                      ),
                    }))
                  }
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#10253d] px-3 text-white"
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Test title</Label>
                <Input
                  value={testForm.title}
                  onChange={(event) =>
                    setTestForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  className="mt-2 border-white/10 bg-[#10253d] text-white"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={testForm.description}
                  onChange={(event) =>
                    setTestForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-[96px] border-white/10 bg-[#10253d] text-white"
                />
              </div>
              <div>
                <Label>Instructions</Label>
                <Textarea
                  value={testForm.instructions}
                  onChange={(event) =>
                    setTestForm((previous) => ({
                      ...previous,
                      instructions: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-[96px] border-white/10 bg-[#10253d] text-white"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Timer (minutes)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={testForm.durationInMinutes}
                    onChange={(event) =>
                      setTestForm((previous) => ({
                        ...previous,
                        durationInMinutes: Number(event.target.value) || 1,
                      }))
                    }
                    className="mt-2 border-white/10 bg-[#10253d] text-white"
                  />
                </div>
                <div>
                  <Label>Pass percentage</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={testForm.passPercentage}
                    onChange={(event) =>
                      setTestForm((previous) => ({
                        ...previous,
                        passPercentage: Number(event.target.value) || 0,
                      }))
                    }
                    className="mt-2 border-white/10 bg-[#10253d] text-white"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#10253d] px-4 py-3">
                    <input
                      type="checkbox"
                      checked={testForm.isPublished}
                      onChange={(event) =>
                        setTestForm((previous) => ({
                          ...previous,
                          isPublished: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-[#d4a017]"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-slate-200">Publish test (Visible to students)</span>
                      <span className="text-xs text-slate-400">
                        {testForm.isPublished
                          ? "✓ Students can see this test"
                          : "✗ Students CANNOT see this test (Draft mode)"}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Select questions</Label>
                  <p className="text-sm text-slate-400">
                    Selected: {testForm.questions.length}
                  </p>
                </div>
                <div className="mt-3 max-h-80 space-y-3 overflow-y-auto rounded-3xl border border-white/10 bg-[#10253d] p-4">
                  {availableQuestionsForTest.length === 0 ? (
                    <p className="text-sm text-slate-300">
                      Create questions for this subject before building a test.
                    </p>
                  ) : (
                    availableQuestionsForTest.map((question) => (
                      <label
                        key={question._id}
                        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#0f2237] px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={testForm.questions.includes(question._id)}
                          onChange={() =>
                            setTestForm((previous) => ({
                              ...previous,
                              questions: previous.questions.includes(question._id)
                                ? previous.questions.filter((id) => id !== question._id)
                                : [...previous.questions, question._id],
                            }))
                          }
                          className="mt-1 h-4 w-4 accent-[#d4a017]"
                        />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {question.questionText}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Marks: {question.marks}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className={`font-semibold ${
                    testForm.isPublished
                      ? "bg-[#d4a017] text-[#06121f] hover:bg-[#e1b84b]"
                      : "bg-slate-600 text-white hover:bg-slate-700"
                  }`}
                  onClick={handleSaveTest}
                >
                  {editingTestId ? "Update test" : "Create test"}
                  <span className="ml-2 text-xs">
                    {testForm.isPublished ? "(Published)" : "(Draft)"}
                  </span>
                </Button>
                {editingTestId ? (
                  <Button
                    variant="outline"
                    className="border-white/15 bg-transparent text-white hover:bg-white/10"
                    onClick={resetTestForm}
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b1b2d] text-white">
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle>Published tests ({filteredTests.length})</CardTitle>
                <select
                  value={testFilterSubject}
                  onChange={(event) => setTestFilterSubject(event.target.value)}
                  className="h-11 rounded-md border border-white/10 bg-[#10253d] px-3 text-white"
                >
                  <option value="all">All subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredTests.map((test) => (
                <div
                  key={test._id}
                  className="rounded-3xl border border-white/10 bg-[#10253d] p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-[#d4a017]">
                        {test.subject?.code}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold">{test.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {test.description || "No description added yet."}
                      </p>
                      <p className="mt-3 text-sm text-slate-400">
                        {test.questionCount} questions - {test.durationInMinutes} minutes - pass{" "}
                        {test.passPercentage}%
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        test.isPublished
                          ? "bg-emerald-400/15 text-emerald-200"
                          : "bg-slate-500/20 text-slate-200"
                      }`}
                    >
                      {test.isPublished ? "Published" : "Draft"}
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="border-white/15 bg-transparent text-white hover:bg-white/10"
                      onClick={() => {
                        setEditingTestId(test._id);
                        setTestForm({
                          subject: test.subject?._id || "",
                          title: test.title,
                          description: test.description || "",
                          instructions: test.instructions || "",
                          durationInMinutes: test.durationInMinutes,
                          passPercentage: test.passPercentage,
                          isPublished: test.isPublished,
                          questions: test.questions.map((question) => question._id),
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteTest(test._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;
