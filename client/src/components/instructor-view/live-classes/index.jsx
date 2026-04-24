import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createLiveClassService,
  deleteLiveClassService,
  fetchInstructorLiveClassesService,
  mediaUploadService,
  updateLiveClassService,
} from "@/services";
import { CalendarPlus, Link2, Trash2, Upload, Video } from "lucide-react";
import { useEffect, useState } from "react";

function getDefaultScheduleValue() {
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  const localDate = new Date(
    oneHourFromNow.getTime() - oneHourFromNow.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().slice(0, 16);
}

function getInitialFormState(courseId = "") {
  return {
    courseId,
    title: "",
    description: "",
    scheduledFor: getDefaultScheduleValue(),
    durationMinutes: "60",
    recordingUrl: "",
    recordingPublicId: "",
  };
}

function toDateTimeLocalValue(value) {
  if (!value) return getDefaultScheduleValue();

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return getDefaultScheduleValue();

  const adjustedDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return adjustedDate.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return "Schedule not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Schedule not set";

  return date.toLocaleString();
}

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

function InstructorLiveClasses({ listOfCourses }) {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(() => getInitialFormState());

  async function loadLiveClasses() {
    try {
      setLoading(true);
      const response = await fetchInstructorLiveClassesService();
      if (response?.success) {
        setLiveClasses(response.data || []);
      }
    } catch (error) {
      console.error("Live class load error:", error);
      setLiveClasses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLiveClasses();
  }, []);

  useEffect(() => {
    if (!formData.courseId && listOfCourses?.length > 0) {
      setFormData((current) => ({
        ...current,
        courseId: listOfCourses[0]._id,
      }));
    }
  }, [listOfCourses, formData.courseId]);

  function resetForm() {
    setEditingId(null);
    setFormData(getInitialFormState(listOfCourses?.[0]?._id || ""));
  }

  async function handleRecordingUpload(file) {
    if (!file) return;

    try {
      setUploadingRecording(true);
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await mediaUploadService(uploadFormData);
      if (response?.success) {
        setFormData((current) => ({
          ...current,
          recordingUrl: response.data.url,
          recordingPublicId: response.data.public_id,
        }));
      } else {
        alert(response?.message || "Recording upload failed");
      }
    } catch (error) {
      console.error("Recording upload error:", error);
      alert("Recording upload failed");
    } finally {
      setUploadingRecording(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.courseId || !formData.title || !formData.scheduledFor) {
      alert("Course, title and schedule are required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        durationMinutes: Number(formData.durationMinutes) || 60,
      };
      const response = editingId
        ? await updateLiveClassService(editingId, payload)
        : await createLiveClassService(payload);

      if (response?.success) {
        resetForm();
        loadLiveClasses();
      } else {
        alert(response?.message || "Could not save live class");
      }
    } catch (error) {
      console.error("Live class save error:", error);
      alert(error?.response?.data?.message || "Could not save live class");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(liveClass) {
    setEditingId(liveClass._id);
    setFormData({
      courseId: liveClass.courseId,
      title: liveClass.title || "",
      description: liveClass.description || "",
      scheduledFor: toDateTimeLocalValue(liveClass.scheduledFor),
      durationMinutes: String(liveClass.durationMinutes || 60),
      recordingUrl: liveClass.recordingUrl || "",
      recordingPublicId: liveClass.recordingPublicId || "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this live class?")) return;

    try {
      const response = await deleteLiveClassService(id);
      if (response?.success) {
        loadLiveClasses();
      } else {
        alert(response?.message || "Could not delete live class");
      }
    } catch (error) {
      console.error("Live class delete error:", error);
      alert("Could not delete live class");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CalendarPlus className="h-6 w-6" />
              {editingId ? "Edit live class" : "Create a live class"}
            </CardTitle>
            <p className="mt-2 text-sm text-slate-500">
              Jitsi links are generated automatically. Upload a recording later to publish the session replay.
            </p>
          </div>
          {editingId ? (
            <Button variant="outline" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {listOfCourses?.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              Create at least one course first so you can attach live classes to it.
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="courseId">Course</Label>
                  <select
                    id="courseId"
                    value={formData.courseId}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        courseId: event.target.value,
                      }))
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    {listOfCourses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Live Class Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Physics live revision"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledFor">Scheduled For</Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        scheduledFor: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="15"
                    step="5"
                    value={formData.durationMinutes}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        durationMinutes: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Tell students what this live class will cover."
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recordingUrl">Recording URL</Label>
                  <Input
                    id="recordingUrl"
                    value={formData.recordingUrl}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        recordingUrl: event.target.value,
                      }))
                    }
                    placeholder="Paste a Cloudinary or video URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recordingUpload">Upload Recording</Label>
                  <Input
                    id="recordingUpload"
                    type="file"
                    accept="video/*"
                    disabled={uploadingRecording}
                    onChange={(event) =>
                      handleRecordingUpload(event.target.files?.[0])
                    }
                  />
                  {uploadingRecording ? (
                    <p className="text-xs text-blue-600">Uploading recording...</p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Uploading stores the video in Cloudinary and fills the recording URL automatically.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Live Class"
                      : "Create Live Class"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Scheduled live classes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading live classes...</p>
          ) : liveClasses.length === 0 ? (
            <p className="text-sm text-slate-500">
              No live classes yet. Your first Jitsi class will appear here after you create it.
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {liveClasses.map((liveClass) => (
                <div
                  key={liveClass._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
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

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>{liveClass.description || "No description added yet."}</p>
                    <p>
                      <strong>Schedule:</strong> {formatDateTime(liveClass.scheduledFor)}
                    </p>
                    <p>
                      <strong>Duration:</strong> {liveClass.durationMinutes} minutes
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button asChild variant="outline">
                      <a
                        href={liveClass.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Link2 className="mr-2 h-4 w-4" />
                        Open Jitsi Link
                      </a>
                    </Button>
                    <Button variant="outline" onClick={() => handleEdit(liveClass)}>
                      <Video className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(liveClass._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>

                  {liveClass.recordingUrl ? (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="font-medium text-slate-900">Recording published</p>
                      <a
                        href={liveClass.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center text-blue-600 hover:underline"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Open uploaded recording
                      </a>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InstructorLiveClasses;
