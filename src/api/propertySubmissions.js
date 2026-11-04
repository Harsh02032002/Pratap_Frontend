import axios from "axios";
import { getWebsiteApiUrl } from "../utils/websiteSession.js";

// This website flow deliberately reads only the website token. A signed-in
// employee/owner panel in another tab must never become the submitting user.
export function getSubmissionToken() {
  try {
    return sessionStorage.getItem("website_token") || localStorage.getItem("website_token") || "";
  } catch {
    return "";
  }
}

export async function propertySubmissionRequest(path, options = {}) {
  const token = getSubmissionToken();
  if (!token) throw Object.assign(new Error("Sign in to submit and track your properties."), { status: 401 });
  try {
    const { data } = await axios({ baseURL: getWebsiteApiUrl(), timeout: 12000, ...options,
      url: `/api/website-enquiry/${path}`, headers: { Authorization: `Bearer ${token}` } });
    if (data?.success !== true) throw new Error(data?.message || "Unable to load property submissions.");
    return data;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    throw Object.assign(new Error(error.response?.data?.message || error.message || "Unable to reach Roomhy. Please try again."), { status: error.response?.status });
  }
}

export const getMyPropertySubmissions = (page, signal) => propertySubmissionRequest(`mine?page=${page}`, { signal });
export const submitPropertyEnquiry = data => propertySubmissionRequest("submit", { method: "POST", data });
