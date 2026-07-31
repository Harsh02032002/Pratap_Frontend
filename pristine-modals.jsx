                    onSubmit={handleLeaveSubmit}
                    minDate={new Date().toISOString().split("T")[0]}
                  />
                  <LeaveHistory leaves={myLeaves} />
                </div>

                <LeaveNoteCard />
              </div>
            )}
          </main>
        </div>

        {/* Mobile-only bottom navigation (hidden on md+) */}
        <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Pay Modal */}
      {payOpen ? (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setPayOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Make Payment</h3>
              <button onClick={() => setPayOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mb-8">
              <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold">Total Payable</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{formatCurrency(totalPayable)}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 text-left">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Room Rent</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(roomRent)}</span>
                </div>
                {electricityCost > 0 && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Electricity Bill</span>
                    <span className="text-sm font-bold text-blue-800 tabular-nums">{formatCurrency(electricityCost)}</span>
                  </div>
                )}
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-800">Total Penalty</span>
                  <span className="text-sm font-bold text-amber-800 tabular-nums">{formatCurrency(totalPenalty)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleOnlinePayment}
                disabled={actionBusy || isPaid}
                className="w-full p-4 border border-slate-200 rounded-xl flex items-center hover:border-blue-600 hover:bg-blue-50 transition group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5 mr-4 text-blue-600" />
                <div className="text-left">
                  <span className="font-semibold text-slate-700">Pay Online</span>
                  <p className="text-xs text-slate-500">Cards • UPI • Wallets • Netbanking</p>
                </div>
              </button>
              <button
                onClick={() => setCashPanelOpen(true)}
                disabled={actionBusy || isPaid || (!canRequestCash && !cashPanelOpen)}
                className="w-full p-4 border border-slate-200 rounded-xl flex items-center hover:border-amber-500 hover:bg-amber-50 transition group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <HandCoins className="w-5 h-5 mr-4 text-amber-600" />
                <div className="text-left">
                  <span className="font-semibold text-slate-700">Pay by Cash</span>
                  <p className="text-xs text-slate-500">Request owner collection and verify OTP</p>
                </div>
              </button>

              {(cashPanelOpen || !["NONE", "", "PENDING"].includes(normalizedCashStatus)) && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                  <p className="font-semibold text-green-800">Cash workflow</p>

                  {canRequestCash && normalizedCashStatus !== "PENDING_APPROVAL" ? (
                    <div className="mt-2 text-green-700">
                      <p className="text-xs mb-2">You are about to request a cash collection. An OTP will be sent to the owner upon approval.</p>
                      <button
                        onClick={handleCashRequest}
                        disabled={actionBusy}
                        className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 text-sm disabled:opacity-60"
                      >
                        {actionBusy ? "Submitting Request..." : "Submit Cash Request"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-green-700 mt-2">
                        Status: <span className="font-semibold">{cashStatusLabel(cashRequestStatus || "PENDING_APPROVAL")}</span>
                      </p>
                      {normalizedCashStatus === "PENDING_APPROVAL" && (
                        <p className="text-xs text-green-700 mt-1">Cash payment request sent. Waiting for owner approval.</p>
                      )}
                      {["OWNER_APPROVED", "OTP_SENT"].includes(normalizedCashStatus) && (
                        <p className="text-xs text-green-700 mt-1">Owner approved your cash payment. Enter the OTP to complete verification.</p>
                      )}
                      {normalizedCashStatus === "PAID" && (
                        <p className="text-xs text-green-700 mt-1">Rent payment completed successfully.</p>
                      )}
                      {normalizedCashStatus === "REJECTED" && (
                        <p className="text-xs text-rose-700 mt-1">The owner rejected this request. Please create a new cash request if needed.</p>
                      )}
                      {normalizedCashStatus === "EXPIRED" && (
                        <p className="text-xs text-amber-700 mt-1">The OTP expired. Ask the owner to approve again.</p>
                      )}
                    </>
                  )}
                </div>
              )}
              <div className={`${showCashOtp ? "" : "hidden"} p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-3`}>
                <p className="text-xs text-amber-800">
                  Owner approved the request. Enter the OTP shared by the owner to complete verification.
                </p>
                <input
                  value={cashOtp}
                  onChange={(e) => setCashOtp(e.target.value)}
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="w-full p-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
                <button
                  onClick={handleCashOtpVerify}
                  disabled={actionBusy || !cashOtp.trim()}
                  className="w-full bg-amber-600 text-white font-semibold py-2 rounded-lg hover:bg-amber-700 text-sm disabled:opacity-60"
                >
                  Verify OTP and Mark Paid
                </button>
                <p className="text-xs text-amber-900 whitespace-pre-line">{actionMsg}</p>
              </div>
              {!cashPanelOpen && actionMsg ? <p className="text-xs text-slate-600 whitespace-pre-line">{actionMsg}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Gate Management Modals */}
      {visitorModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setVisitorModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setVisitorModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Generate Visitor Pass</h3>
            <form onSubmit={handleCreateVisitorPass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Guest Name *</label>
                <input type="text" value={visitorGuestName} onChange={e => setVisitorGuestName(e.target.value)} required className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Guest Phone *</label>
                <input type="text" value={visitorGuestPhone} onChange={e => setVisitorGuestPhone(e.target.value)} required className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. 9876543210" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Visit Date *</label>
                <input type="date" value={visitorDate} onChange={e => setVisitorDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <button type="submit" disabled={actionBusy} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2">
                {actionBusy ? "Generating..." : "Generate Pass"}
              </button>
            </form>
          </div>
        </div>
      )}

      {leaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setLeaveModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLeaveModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Submit Leave Request</h3>
            <form onSubmit={handleCreateLeaveRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Departure *</label>
                  <input type="date" value={leaveDepartureDate} onChange={e => setLeaveDepartureDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Return *</label>
                  <input type="date" value={leaveReturnDate} onChange={e => setLeaveReturnDate(e.target.value)} required min={leaveDepartureDate || new Date().toISOString().split("T")[0]} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason for Leave *</label>
                <textarea value={gateLeaveReason} onChange={e => setGateLeaveReason(e.target.value)} required rows="3" placeholder="e.g. Going home for holidays" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>
              <button type="submit" disabled={actionBusy} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2">
                {actionBusy ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Generic Modal */}
      {genericModal ? (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setGenericModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">{genericModal.title}</h3>
              <button onClick={() => setGenericModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>{genericModal.body}</div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-right">
              {genericModal.footer || (
                <button onClick={() => setGenericModal(null)} className="text-slate-500 text-sm hover:underline">
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {documentViewer ? (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={closeDocumentViewer}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{documentViewer.title}</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                  {documentViewer.type === "receipt" ? "Bill Preview" : "Agreement Preview"}
                </p>
              </div>
              <button onClick={closeDocumentViewer} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              {documentViewer.body}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              {documentViewer.type === "receipt" ? (
                <button
                  onClick={() => {
                    const item = docs.find((d) => d.key === "receipt")?.rentItem;
                    if (item) downloadReceiptPdf(item);
                  }}
                  disabled={pdfBusy}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {pdfBusy ? "Generating..." : "Download PDF"}
                </button>
              ) : null}
              <button
                onClick={closeDocumentViewer}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
