import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchAdminExamsForCourseService,
  fetchAutoResultPreviewService,
  fetchInstructorCourseListService,
  fetchPublishedResultsService,
  publishResultsService,
} from "@/services";
import {
  BarChart3,
  Plus,
  Send,
  Trash2,
  Upload,
  WandSparkles,
} from "lucide-react";

const emptyResultRow = () => ({
  userId: "",
  studentName: "",
  studentEmail: "",
  scorePercent: 0,
  passed: false,
  remarks: "",
  attemptCount: 1,
  attemptedAt: null,
});

function formatDateTime(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString();
}

function parseBooleanValue(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (["true", "pass", "passed", "yes", "1"].includes(normalized)) return true;
  if (["false", "fail", "failed", "no", "0"].includes(normalized)) return false;
  return null;
}

function splitCsvLine(line) {
  return line
    .split(/,(?=(?:(?:[^\"]*\"){2})*[^\"]*$)/)
    .map((cell) => cell.trim().replace(/^"(.*)"$/, "$1"));
}

function parseCsvResults(text, fallbackPassed) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV needs a header row and at least one result row");
  }

  const headers = splitCsvLine(lines[0]).map((header) =>
    header.trim().toLowerCase()
  );

  const nameIndex = headers.indexOf("studentname");
  const emailIndex = headers.indexOf("studentemail");
  const scoreIndex = headers.indexOf("scorepercent");
  const passedIndex = headers.indexOf("passed");
  const remarksIndex = headers.indexOf("remarks");

  if (nameIndex === -1 || emailIndex === -1 || scoreIndex === -1) {
    throw new Error(
      "CSV headers must include studentName, studentEmail and scorePercent"
    );
  }

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const parsedPassed =
      passedIndex === -1 ? null : parseBooleanValue(cells[passedIndex]);

    return {
      ...emptyResultRow(),
      studentName: cells[nameIndex] || "",
      studentEmail: cells[emailIndex] || "",
      scorePercent: Number(cells[scoreIndex] || 0),
      passed: parsedPassed === null ? fallbackPassed : parsedPassed,
      remarks: remarksIndex === -1 ? "" : cells[remarksIndex] || "",
    };
  });
}

function AdminResultsManager() {
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [examId, setExamId] = useState("");
  const [calcMode, setCalcMode] = useState("best");
  const [previewRows, setPreviewRows] = useState([]);
  const [previewSource, setPreviewSource] = useState("manual");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedResults, setPublishedResults] = useState([]);
  const [publishedLoading, setPublishedLoading] = useState(false);

  async function loadCourses() {
    const response = await fetchInstructorCourseListService();
    if (response?.success) {
      setCourses(response.data || []);
    }
  }

  async function loadExamsForCourse(selectedCourseId) {
    if (!selectedCourseId) {
      setExams([]);
      return;
    }

    const response = await fetchAdminExamsForCourseService(selectedCourseId);
    if (response?.success) {
      setExams(response.data || []);
    }
  }

  async function loadPublishedResults(selectedExamId) {
    if (!selectedExamId) {
      setPublishedResults([]);
      return;
    }

    try {
      setPublishedLoading(true);
      const response = await fetchPublishedResultsService({ examId: selectedExamId });
      if (response?.success) {
        setPublishedResults(response.data || []);
      }
    } finally {
      setPublishedLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    setExamId("");
    setPreviewRows([]);
    setPublishedResults([]);
    loadExamsForCourse(courseId);
  }, [courseId]);

  useEffect(() => {
    setPreviewRows([]);
    loadPublishedResults(examId);
  }, [examId]);

  const selectedExam = useMemo(
    () => exams.find((exam) => exam._id === examId) || null,
    [exams, examId]
  );

  async function handleAutoPreview() {
    if (!examId) {
      alert("Select an exam first");
      return;
    }

    try {
      setPreviewLoading(true);
      const response = await fetchAutoResultPreviewService(examId, calcMode);
      if (response?.success) {
        setPreviewSource("auto");
        setPreviewRows(response.data?.results || []);
      } else {
        alert(response?.message || "Could not calculate results");
      }
    } catch (error) {
      console.error("Auto result preview error:", error);
      alert(error?.response?.data?.message || "Could not calculate results");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleCsvUpload(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const rows = parseCsvResults(text, null).map((row) => ({
        ...row,
        passed:
          row.passed === null
            ? row.scorePercent >= Number(selectedExam?.passingScorePercent || 0)
            : row.passed,
      }));

      setPreviewSource("manual");
      setPreviewRows(rows);
    } catch (error) {
      console.error("CSV parse error:", error);
      alert(error.message || "Could not parse CSV file");
    }
  }

  function updateRow(index, patch) {
    setPreviewRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row
      )
    );
  }

  function addManualRow() {
    setPreviewSource("manual");
    setPreviewRows((currentRows) => [...currentRows, emptyResultRow()]);
  }

  function removeRow(index) {
    setPreviewRows((currentRows) =>
      currentRows.filter((_, rowIndex) => rowIndex !== index)
    );
  }

  async function handlePublish() {
    if (!examId) {
      alert("Select an exam first");
      return;
    }

    if (previewRows.length === 0) {
      alert("Prepare or upload result rows first");
      return;
    }

    try {
      setPublishing(true);
      const response = await publishResultsService({
        examId,
        source: previewSource,
        results: previewRows,
      });

      if (response?.success) {
        alert(response.message || "Results published");
        loadPublishedResults(examId);
      } else {
        alert(response?.message || "Could not publish results");
      }
    } catch (error) {
      console.error("Publish results error:", error);
      alert(error?.response?.data?.message || "Could not publish results");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-3xl font-bold">
          <BarChart3 className="h-8 w-8" />
          Result publishing
        </h2>
        <p className="mt-2 text-gray-600">
          Upload a manual result sheet or auto-calculate from exam attempts, then publish the final list.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select course and exam</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Course</Label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
            >
              <option value="">Choose a course...</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Exam</Label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={examId}
              onChange={(event) => setExamId(event.target.value)}
              disabled={!courseId}
            >
              <option value="">Choose an exam...</option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {examId ? (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Prepare results</CardTitle>
                <p className="mt-2 text-sm text-gray-500">
                  Publish for <strong>{selectedExam?.title}</strong>. Passing score is{" "}
                  <strong>{selectedExam?.passingScorePercent}%</strong>.
                </p>
              </div>
              <Button onClick={handlePublish} disabled={publishing || previewRows.length === 0}>
                <Send className="mr-2 h-4 w-4" />
                {publishing ? "Publishing..." : "Publish Results"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2">
                    <WandSparkles className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Auto-calculate</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Build the result list from student exam attempts.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                      <Label>Calculation mode</Label>
                      <select
                        className="w-full rounded-md border px-3 py-2"
                        value={calcMode}
                        onChange={(event) => setCalcMode(event.target.value)}
                      >
                        <option value="best">Best attempt</option>
                        <option value="latest">Latest attempt</option>
                      </select>
                    </div>
                    <Button onClick={handleAutoPreview} disabled={previewLoading}>
                      {previewLoading ? "Calculating..." : "Preview Auto Results"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-semibold">Upload results</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Import CSV with headers:
                    <code className="ml-1 rounded bg-slate-100 px-1 py-0.5">
                      studentName,studentEmail,scorePercent,passed,remarks
                    </code>
                  </p>
                  <div className="mt-4 space-y-3">
                    <Input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(event) => handleCsvUpload(event.target.files?.[0])}
                    />
                    <Button type="button" variant="outline" onClick={addManualRow}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Manual Row
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <h3 className="font-semibold">Preview Before Publish</h3>
                    <p className="text-sm text-gray-500">
                      Source: <strong className="capitalize">{previewSource}</strong> | {previewRows.length} rows
                    </p>
                  </div>
                </div>

                {previewRows.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-gray-500">
                    Generate auto results or upload a CSV file to start.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Attempted</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewRows.map((row, index) => (
                          <TableRow key={`${row.studentEmail}-${index}`}>
                            <TableCell>
                              <Input
                                value={row.studentName}
                                onChange={(event) =>
                                  updateRow(index, { studentName: event.target.value })
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.studentEmail}
                                onChange={(event) =>
                                  updateRow(index, { studentEmail: event.target.value })
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={row.scorePercent}
                                onChange={(event) =>
                                  updateRow(index, {
                                    scorePercent: Number(event.target.value || 0),
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <select
                                className="w-full rounded-md border px-3 py-2"
                                value={row.passed ? "passed" : "failed"}
                                onChange={(event) =>
                                  updateRow(index, {
                                    passed: event.target.value === "passed",
                                  })
                                }
                              >
                                <option value="passed">Passed</option>
                                <option value="failed">Failed</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.remarks || ""}
                                onChange={(event) =>
                                  updateRow(index, { remarks: event.target.value })
                                }
                              />
                            </TableCell>
                            <TableCell>{row.attemptCount || 1}</TableCell>
                            <TableCell>{formatDateTime(row.attemptedAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeRow(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Published results ({publishedResults.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {publishedLoading ? (
                <p className="text-sm text-gray-500">Loading published results...</p>
              ) : publishedResults.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No published result list for this exam yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {publishedResults.map((row) => (
                        <TableRow key={row._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{row.studentName}</p>
                              <p className="text-xs text-gray-500">{row.studentEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>{row.scorePercent}%</TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                row.passed
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {row.passed ? "Passed" : "Failed"}
                            </span>
                          </TableCell>
                          <TableCell className="capitalize">{row.source}</TableCell>
                          <TableCell>{formatDateTime(row.publishedAt)}</TableCell>
                          <TableCell>{row.remarks || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

export default AdminResultsManager;
