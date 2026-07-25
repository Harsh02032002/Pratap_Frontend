import React, { useEffect, useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerRooms, updateRoom } from "../../utils/propertyowner";
import { Image as ImageIcon, UploadCloud, Loader2, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export default function RoomPhotos() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await fetchOwnerRooms(owner.loginId);
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRooms(); }, [owner.loginId]);

  const handleUpload = async (roomId, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const compress = (file) =>
      new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) { resolve(file); return; }
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const scale = Math.min(1200 / img.width, 1);
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.85);
          };
          img.onerror = reject;
          img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    try {
      setSaving((s) => ({ ...s, [roomId]: true }));
      const compressed = [];
      for (const file of files) {
        compressed.push(await compress(file));
      }

      const room = rooms.find((r) => String(r._id || r.id) === String(roomId));
      const existing = Array.isArray(room?.media) ? room.media : [];
      const newUrls = compressed.map((file) => URL.createObjectURL(file));

      await updateRoom(roomId, { media: [...existing, ...newUrls] });
      await loadRooms();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setSaving((s) => ({ ...s, [roomId]: false }));
    }
  };

  const paginated = rooms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(rooms.length / PAGE_SIZE));

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Room Photos"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="mb-8">
        <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Room Photos</h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Upload photos for your rooms. Photos will be live on website after admin approval.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 shadow-soft text-center">
          <div className="w-14 h-14 bg-muted/60 rounded-full flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="text-slate-400" />
          </div>
          <h3 className="font-serif text-[22px] text-foreground mb-1">No Rooms Found</h3>
          <p className="text-[13.5px] text-muted-foreground">Create rooms first, then upload photos.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginated.map((room) => {
              const media = Array.isArray(room.media) ? room.media : [];
              const isSaving = !!saving[room._id || room.id];
              return (
                <div key={room._id || room.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{room.roomNo || room.title || "Room"}</h3>
                      <p className="text-[11px] text-muted-foreground">{room.propertyTitle || room.property?.title || ""}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${room.pendingChanges?.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                      {room.pendingChanges?.status === 'pending' ? 'Pending Approval' : 'Live'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {media.slice(0, 6).map((m, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                        <img src={m} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                    {media.length === 0 && (
                      <div className="col-span-3 aspect-[16/9] rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon size={22} />
                        <span className="text-[10px] font-bold mt-1">No Photos</span>
                      </div>
                    )}
                  </div>

                  <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer ${isSaving ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {isSaving ? <Loader2 className="animate-spin" size={14} /> : <UploadCloud size={14} />}
                    {isSaving ? 'Saving...' : media.length ? 'Replace / Add Photos' : 'Upload Photos'}
                    <input type="file" accept="image/*" multiple className="hidden" disabled={isSaving} onChange={(e) => handleUpload(room._id || room.id, e)} />
                  </label>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">Photos require admin approval before going live</p>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <span className="text-[13px] text-muted-foreground">Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, rooms.length)} of {rooms.length}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40"><ChevronLeft size={15} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1).reduce((acc, n, idx, arr) => { if (idx > 0 && n - arr[idx - 1] > 1) acc.push("..."); acc.push(n); return acc; }, []).map((n, i) => n === "..." ? <span key={`e-${i}`} className="px-1 text-muted-foreground">…</span> : <button key={n} onClick={() => setPage(n)} className={`h-8 w-8 rounded-lg text-[13px] font-semibold border ${page === n ? 'bg-slate-900 text-white border-slate-900' : 'bg-card border-border hover:bg-muted'}`}>{n}</button>)}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40"><ChevronRight size={15} /></button>
              </div>
            </div>
          )}
        </>
      )}
    </PropertyOwnerLayout>
  );
}
