import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { getMyPropertySubmissions, getSubmissionToken } from "../api/propertySubmissions";
import {
  getWebsiteApiUrl,
  getWebsiteUserEmail,
  getWebsiteUserId,
  isWebsiteLoggedIn,
} from "../utils/websiteSession";
import {
  ACCOUNT_ACTIVITY_EVENT,
  ACTIVITY_STAYS,
  ACTIVITY_SUBMISSIONS,
  hasActivityMarker,
} from "../utils/accountActivity";

async function fetchStayCount(identity, email, signal) {
  const query = `type=count${email ? `&email=${encodeURIComponent(email)}` : ""}`;
  const res = await fetch(
    `${getWebsiteApiUrl()}/api/booking/user/${encodeURIComponent(identity)}?${query}`,
    { signal, cache: "no-store" }
  );
  if (!res.ok) throw new Error("Unable to check bookings");
  const json = await res.json();
  return Number(json?.count) || 0;
}

/**
 * Whether the signed-in website user has anything to show under
 * "My Stays" (they bid or booked) and "My Property Submissions" (they listed a
 * property). Both are false for signed-out users and until the check finishes,
 * so the menu never advertises an empty page.
 */
export function useAccountActivity() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [, setTick] = useState(0);

  const identity = String(getWebsiteUserId() || getWebsiteUserEmail() || "").trim();
  const email = getWebsiteUserEmail();
  const signedIn = Boolean(isAuthenticated && user && identity && isWebsiteLoggedIn());
  const scope = identity.toLowerCase();

  // A bid/booking/submission just happened somewhere in the app.
  useEffect(() => {
    const onChange = () => {
      setTick((n) => n + 1);
      queryClient.invalidateQueries({ queryKey: ["accountActivity"] });
    };
    window.addEventListener(ACCOUNT_ACTIVITY_EVENT, onChange);
    return () => window.removeEventListener(ACCOUNT_ACTIVITY_EVENT, onChange);
  }, [queryClient]);

  const stays = useQuery({
    queryKey: ["accountActivity", "stays", scope],
    queryFn: ({ signal }) => fetchStayCount(identity, email, signal),
    enabled: signedIn,
    staleTime: 30000,
    retry: false,
  });

  const submissions = useQuery({
    queryKey: ["accountActivity", "submissions", scope],
    queryFn: ({ signal }) => getMyPropertySubmissions(1, signal).then((d) => Number(d?.total) || 0),
    enabled: signedIn && Boolean(getSubmissionToken()),
    staleTime: 30000,
    retry: false,
  });

  return {
    hasStays: signedIn && ((stays.data || 0) > 0 || hasActivityMarker(ACTIVITY_STAYS)),
    hasSubmissions: signedIn && ((submissions.data || 0) > 0 || hasActivityMarker(ACTIVITY_SUBMISSIONS)),
  };
}
