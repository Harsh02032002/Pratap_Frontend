import React from "react";
import { Navigate } from "react-router-dom";

// Keep bookmarked URLs working through the real report generator.
export default function ReportRedirect() {
  return <Navigate to="/propertyowner/reports" replace />;
}
