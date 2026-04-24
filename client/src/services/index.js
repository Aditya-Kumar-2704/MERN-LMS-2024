import axios from "axios";
import axiosInstance from "@/api/axiosInstance";

async function fetchSignedCloudinaryParams(endpoint = "/media/sign-upload", body = {}) {
  const { data } = await axiosInstance.post(endpoint, body);
  if (!data?.success) {
    throw new Error(data?.message || "Could not start upload");
  }
  return data.data;
}

function cloudinaryDirectUrl(cloudName, segment) {
  return `https://api.cloudinary.com/v1_1/${cloudName}/${segment}/upload`;
}

/**
 * Browser → Cloudinary (signed). Avoids sending the file through your Node server.
 */
export async function mediaUploadDirect(
  file,
  resourceType,
  onProgressCallback,
  options = {}
) {
  const sign = await fetchSignedCloudinaryParams(
    options.signatureEndpoint,
    options.signatureBody
  );
  const segment = resourceType === "image" ? "image" : "video";
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sign.apiKey);
  fd.append("timestamp", String(sign.timestamp));
  fd.append("signature", sign.signature);
  fd.append("folder", sign.folder);

  const { data } = await axios.post(
    cloudinaryDirectUrl(sign.cloudName, segment),
    fd,
    {
      timeout: 0,
      onUploadProgress: (e) => {
        if (!e.total) return;
        const pct = Math.round((e.loaded * 100) / e.total);
        onProgressCallback?.(pct);
      },
    }
  );

  return {
    success: true,
    data: {
      ...data,
      url: data.secure_url,
      public_id: data.public_id,
    },
  };
}

export async function profileImageUploadService(file, onProgressCallback) {
  return mediaUploadDirect(file, "image", onProgressCallback, {
    signatureEndpoint: "/auth/profile-image-sign",
    signatureBody: {
      folder: "vikash-profiles",
    },
  });
}

export async function registerService(formData) {
  const { data } = await axiosInstance.post("/auth/register", formData);

  return data;
}

export async function loginService(formData) {
  const { data } = await axiosInstance.post("/auth/login", formData);

  return data;
}

export async function checkAuthService() {
  const { data } = await axiosInstance.get("/auth/check-auth");

  return data;
}

export async function updateUserProfileService(payload) {
  const { data } = await axiosInstance.put("/auth/profile", payload);

  return data;
}

export async function mediaUploadService(formData, onProgressCallback) {
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    throw new Error('FormData must include a binary "file" field');
  }
  const isImage =
    typeof file.type === "string" && file.type.startsWith("image/");
  return mediaUploadDirect(
    file,
    isImage ? "image" : "video",
    onProgressCallback
  );
}

export async function mediaDeleteService(id) {
  const { data } = await axiosInstance.delete(`/media/delete/${id}`);

  return data;
}

export async function fetchInstructorCourseListService() {
  const { data } = await axiosInstance.get(`/instructor/course/get`);

  return data;
}

export async function addNewCourseService(formData) {
  const { data } = await axiosInstance.post(`/instructor/course/add`, formData);

  return data;
}

export async function fetchInstructorCourseDetailsService(id) {
  const { data } = await axiosInstance.get(
    `/instructor/course/get/details/${id}`
  );

  return data;
}

export async function updateCourseByIdService(id, formData) {
  const { data } = await axiosInstance.put(
    `/instructor/course/update/${id}`,
    formData
  );

  return data;
}

export async function fetchInstructorLiveClassesService() {
  const { data } = await axiosInstance.get(`/instructor/live-class`);

  return data;
}

export async function createLiveClassService(payload) {
  const { data } = await axiosInstance.post(`/instructor/live-class`, payload);

  return data;
}

export async function updateLiveClassService(id, payload) {
  const { data } = await axiosInstance.put(
    `/instructor/live-class/${id}`,
    payload
  );

  return data;
}

export async function deleteLiveClassService(id) {
  const { data } = await axiosInstance.delete(`/instructor/live-class/${id}`);

  return data;
}

export async function mediaBulkUploadService(formData, onProgressCallback) {
  const files = formData.getAll("files");
  if (!files.length) {
    return { success: false, message: "No files provided" };
  }

  const sign = await fetchSignedCloudinaryParams();
  const url = cloudinaryDirectUrl(sign.cloudName, "video");
  const concurrency = 3;
  const progresses = files.map(() => 0);

  const reportOverall = () => {
    const sum = progresses.reduce((a, b) => a + b, 0);
    onProgressCallback?.(Math.round(sum / files.length));
  };

  async function uploadOne(file, index) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", sign.apiKey);
    fd.append("timestamp", String(sign.timestamp));
    fd.append("signature", sign.signature);
    fd.append("folder", sign.folder);

    const { data } = await axios.post(url, fd, {
      timeout: 0,
      onUploadProgress: (e) => {
        if (!e.total) return;
        progresses[index] = Math.round((e.loaded * 100) / e.total);
        reportOverall();
      },
    });

    return {
      url: data.secure_url,
      secure_url: data.secure_url,
      public_id: data.public_id,
    };
  }

  let cursor = 0;
  const results = new Array(files.length);

  async function worker() {
    while (cursor < files.length) {
      const i = cursor++;
      results[i] = await uploadOne(files[i], i);
    }
  }

  const pool = Math.min(concurrency, files.length);
  await Promise.all(Array.from({ length: pool }, () => worker()));

  return { success: true, data: results };
}

export async function fetchStudentViewCourseListService(query) {
  const { data } = await axiosInstance.get(`/student/course/get?${query}`);

  return data;
}

export async function fetchStudentViewCourseDetailsService(courseId) {
  const { data } = await axiosInstance.get(
    `/student/course/get/details/${courseId}`
  );

  return data;
}

export async function checkCoursePurchaseInfoService(courseId, studentId) {
  const { data } = await axiosInstance.get(
    `/student/course/purchase-info/${courseId}/${studentId}`
  );

  return data;
}

export async function createPaymentService(formData) {
  const { data } = await axiosInstance.post(`/student/order/create`, formData);

  return data;
}

export async function captureAndFinalizePaymentService(
  paymentId,
  payerId,
  orderId
) {
  const { data } = await axiosInstance.post(`/student/order/capture`, {
    paymentId,
    payerId,
    orderId,
  });

  return data;
}

export async function fetchStudentBoughtCoursesService(studentId) {
  const { data } = await axiosInstance.get(
    `/student/courses-bought/get/${studentId}`
  );

  return data;
}

export async function fetchStudentLiveClassesService() {
  const { data } = await axiosInstance.get(`/student/live-class`);

  return data;
}

export async function fetchStudentPublishedResultsService(params) {
  const { data } = await axiosInstance.get(`/student/result`, {
    params,
  });

  return data;
}

export async function getCurrentCourseProgressService(userId, courseId) {
  const { data } = await axiosInstance.get(
    `/student/course-progress/get/${userId}/${courseId}`
  );

  return data;
}

export async function markLectureAsViewedService(userId, courseId, lectureId) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/mark-lecture-viewed`,
    {
      userId,
      courseId,
      lectureId,
    }
  );

  return data;
}

export async function resetCourseProgressService(userId, courseId) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/reset-progress`,
    {
      userId,
      courseId,
    }
  );

  return data;
}

// Admin Services
export async function fetchAllUsersService() {
  const { data } = await axiosInstance.get(`/admin/users`);

  return data;
}

export async function updateUserRoleService(userId, role) {
  const { data } = await axiosInstance.put(`/admin/users/${userId}/role`, {
    role,
  });

  return data;
}

export async function deleteUserService(userId) {
  const { data } = await axiosInstance.delete(`/admin/users/${userId}`);

  return data;
}

export async function fetchAssessmentSummaryService() {
  const { data } = await axiosInstance.get(`/admin/assessment/summary`);
  return data;
}

export async function fetchAssessmentSubjectsService() {
  const { data } = await axiosInstance.get(`/admin/assessment/subjects`);
  return data;
}

export async function createAssessmentSubjectService(payload) {
  const { data } = await axiosInstance.post(`/admin/assessment/subjects`, payload);
  return data;
}

export async function updateAssessmentSubjectService(subjectId, payload) {
  const { data } = await axiosInstance.put(
    `/admin/assessment/subjects/${subjectId}`,
    payload
  );
  return data;
}

export async function deleteAssessmentSubjectService(subjectId) {
  const { data } = await axiosInstance.delete(
    `/admin/assessment/subjects/${subjectId}`
  );
  return data;
}

export async function fetchAssessmentQuestionsService(subjectId = "") {
  const { data } = await axiosInstance.get(`/admin/assessment/questions`, {
    params: subjectId ? { subject: subjectId } : {},
  });
  return data;
}

export async function createAssessmentQuestionService(payload) {
  const { data } = await axiosInstance.post(`/admin/assessment/questions`, payload);
  return data;
}

export async function updateAssessmentQuestionService(questionId, payload) {
  const { data } = await axiosInstance.put(
    `/admin/assessment/questions/${questionId}`,
    payload
  );
  return data;
}

export async function deleteAssessmentQuestionService(questionId) {
  const { data } = await axiosInstance.delete(
    `/admin/assessment/questions/${questionId}`
  );
  return data;
}

export async function fetchAssessmentTestsService(subjectId = "") {
  const { data } = await axiosInstance.get(`/admin/assessment/tests`, {
    params: subjectId ? { subject: subjectId } : {},
  });
  return data;
}

export async function createAssessmentTestService(payload) {
  const { data } = await axiosInstance.post(`/admin/assessment/tests`, payload);
  return data;
}

export async function updateAssessmentTestService(testId, payload) {
  const { data } = await axiosInstance.put(
    `/admin/assessment/tests/${testId}`,
    payload
  );
  return data;
}

export async function deleteAssessmentTestService(testId) {
  const { data } = await axiosInstance.delete(`/admin/assessment/tests/${testId}`);
  return data;
}

export async function fetchStudentAssessmentDashboardService() {
  const { data } = await axiosInstance.get(`/student/assessment/dashboard`);
  return data;
}

export async function fetchStudentAssessmentTestsService(subjectId = "") {
  const { data } = await axiosInstance.get(`/student/assessment/tests`, {
    params: subjectId ? { subject: subjectId } : {},
  });
  return data;
}

export async function fetchStudentAssessmentTestService(testId) {
  const { data } = await axiosInstance.get(`/student/assessment/tests/${testId}`);
  return data;
}

export async function submitStudentAssessmentTestService(
  testId,
  answers,
  timeSpentInSeconds
) {
  const { data } = await axiosInstance.post(
    `/student/assessment/tests/${testId}/submit`,
    {
      answers,
      timeSpentInSeconds,
    }
  );
  return data;
}

export async function fetchStudentAssessmentResultsService() {
  const { data } = await axiosInstance.get(`/student/assessment/results`);
  return data;
}

export async function fetchStudentAssessmentResultService(resultId) {
  const { data } = await axiosInstance.get(
    `/student/assessment/results/${resultId}`
  );
  return data;
}

export async function createExamService(payload) {
  const { data } = await axiosInstance.post(`/admin/exams`, payload);
  return data;
}

export async function fetchAdminExamsForCourseService(courseId) {
  const { data } = await axiosInstance.get(`/admin/exams/course/${courseId}`);
  return data;
}

export async function fetchAutoResultPreviewService(examId, mode = "best") {
  const { data } = await axiosInstance.get(`/admin/results/preview/auto`, {
    params: { examId, mode },
  });
  return data;
}

export async function publishResultsService(payload) {
  const { data } = await axiosInstance.post(`/admin/results/publish`, payload);
  return data;
}

export async function fetchPublishedResultsService(params) {
  const { data } = await axiosInstance.get(`/admin/results/published`, {
    params,
  });
  return data;
}

export async function fetchAdminExamByIdService(examId) {
  const { data } = await axiosInstance.get(`/admin/exams/${examId}`);
  return data;
}

export async function updateExamService(examId, payload) {
  const { data } = await axiosInstance.put(`/admin/exams/${examId}`, payload);
  return data;
}

export async function deleteExamService(examId) {
  const { data } = await axiosInstance.delete(`/admin/exams/${examId}`);
  return data;
}

export async function listStudentExamsForCourseService(courseId) {
  const { data } = await axiosInstance.get(
    `/student/exam/course/${courseId}/list`
  );
  return data;
}

export async function fetchStudentExamService(examId) {
  const { data } = await axiosInstance.get(`/student/exam/${examId}`);
  return data;
}

export async function submitStudentExamService(examId, answers) {
  const { data } = await axiosInstance.post(`/student/exam/${examId}/submit`, {
    answers,
  });
  return data;
}

export async function getStudentLastExamAttemptService(examId) {
  const { data } = await axiosInstance.get(`/student/exam/${examId}/attempt`);
  return data;
}

export async function createTopperService(formData) {
  const { data } = await axiosInstance.post("/admin/toppers", formData);
  return data;
}

export async function fetchToppersService() {
  const { data } = await axiosInstance.get("/student/exam/toppers");
  return data;
}

export async function updateTopperService(id, formData) {
  const { data } = await axiosInstance.put(`/admin/toppers/${id}`, formData);
  return data;
}

export async function deleteTopperService(id) {
  const { data } = await axiosInstance.delete(`/admin/toppers/${id}`);
  return data;
}
