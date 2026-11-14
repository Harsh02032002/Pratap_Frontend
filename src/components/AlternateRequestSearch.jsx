import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { alternateRequestSearchPath } from "../utils/alternativeRequests";

export default function AlternateRequestSearch() {
  const [bookingId, setBookingId] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <form role="search" aria-label="Search alternate requests" onSubmit={event => {
      event.preventDefault();
      if (bookingId.trim()) navigate(alternateRequestSearchPath(bookingId, location.pathname));
    }} className="hidden md:flex items-center bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 h-[44px] w-96 focus-within:border-[#0E7C86] focus-within:ring-1 focus-within:ring-[#0E7C86] transition-all">
      <button type="submit" aria-label="Search alternate requests by Booking ID" className="text-[#4A5961] shrink-0">
        <Search size={17} />
      </button>
      <input type="search" value={bookingId} onChange={event => setBookingId(event.target.value)}
        aria-label="Booking ID for alternate requests" placeholder="Search alternate requests by Booking ID..."
        className="bg-transparent border-none outline-none text-sm ml-2.5 w-full text-[#10242A] placeholder:text-[#708088]" />
    </form>
  );
}
