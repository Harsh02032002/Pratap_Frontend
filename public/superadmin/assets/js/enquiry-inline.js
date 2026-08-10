lucide.createIcons();

// API Configuration
const API_URL = 'http://localhost:5001';

// Helper function to read visits from storage
function readVisitsFromStorage() {
    if (window.safeStorage && window.safeStorage.getVisits) {
        return window.safeStorage.getVisits() || [];
    }
    try {
        return JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
    } catch (e) {
        return [];
    }
}

// Global variables
let currentApprovingId = null;

function navigateTo(path) {
    window.location.href = path;
}

function toggleSubmenu(id, element) {
    const submenu = document.getElementById(id);
    if (submenu.classList.contains('open')) submenu.classList.remove('open');
    else submenu.classList.add('open');
}

function switchTab(tab) {
    const isVisits = tab === 'visits';
    document.getElementById('tab-visits').className = isVisits ? "px-6 py-3 font-semibold text-purple-600 border-b-2 border-purple-600 transition-all" : "px-6 py-3 font-semibold text-gray-500 border-b-2 border-transparent transition-all";
    document.getElementById('tab-rooms').className = !isVisits ? "px-6 py-3 font-semibold text-purple-600 border-b-2 border-purple-600 transition-all" : "px-6 py-3 font-semibold text-gray-500 border-b-2 border-transparent transition-all";
    document.getElementById('tab-content-visits').classList.toggle('hidden', !isVisits);
    document.getElementById('tab-content-rooms').classList.toggle('hidden', isVisits);
}

async function fetchEnquiries() {
    console.log('🔄 fetchEnquiries() called - Super Admin Enquiry Page');
    const tbody = document.getElementById('enquiryBody');

    if (!tbody) {
        console.error('❌ Table body element not found! ID: enquiryBody');
        return;
    }

    let visits = [];

    // Try to fetch from backend API first
    try {
        let token = '';
        try {
            token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';
        } catch (tokenErr) {
            console.warn('?? Could not read token from storage:', tokenErr.message);
        }
        const apiUrl = API_URL + '/api/visits/pending';

        console.log('🔗 Fetching from API:', apiUrl);
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: token ? { 'Authorization': token } : {}
        });

        if (!response.ok) {
            throw new Error(`API responded with ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📡 API response:', data);
        const allVisits = data.visits || data || [];
        console.log('? Loaded from API:', allVisits.length, 'visits');

        // Filter for pending/submitted visits
        visits = allVisits.filter(v => ['submitted', 'pending', 'pending_review'].includes(v.status));
        console.log('? Filtered to pending/submitted:', visits.length, 'visits');

        if (visits.length > 0) {
            console.log('   First visit:', {
                id: visits[0]._id,
                status: visits[0].status,
                property: visits[0].propertyInfo?.name || visits[0].property?.name || 'Unknown'
            });
        }

    } catch (apiErr) {
        console.warn('⚠️ API fetch failed, falling back to localStorage:', apiErr.message);

        // Fallback to safe storage / memory
        try {
            visits = readVisitsFromStorage();
            console.log('Fallback - visits loaded:', visits.length, 'visits');
        } catch (err) {
            console.error('Failed to load visits from storage:', err);
            visits = [];
        }
    }

    // Filter for pending/submitted status
    const filtered = visits.filter(v => {
        const hasStatus = ['pending', 'submitted'].includes(v.status);
        if (!hasStatus) {
            console.warn('⏭️ Skipping visit (non-pending status):', v._id, 'Status:', v.status);
        }
        return hasStatus;
    });

    visits = filtered;
    console.log('? Filtered to pending/submitted:', visits.length, 'visits');

    if (visits.length === 0) {
        console.warn('⚠️ No pending visits found. Showing empty message.');
        tbody.innerHTML = '<tr><td colspan="28" class="px-6 py-12 text-center text-gray-400">No pending reports found. <a href="javascript:location.reload()" class="text-purple-600 underline">Refresh</a></td></tr>';
        renderStatusCounters();
        return;
    }

    console.log('📋 Rendering', visits.length, 'visits to table');

    tbody.innerHTML = visits.map((v, idx) => {
        console.log(`   Rendering ${idx + 1}/${visits.length}: ${v._id}`);

        // Get propertyInfo or build it from flat fields
        const prop = v.propertyInfo || {
            staffName: v.staffName,
            staffId: v.staffId,
            name: v.propertyName,
            propertyType: v.propertyType,
            address: v.address,
            area: v.area,
            landmark: v.landmark,
            nearbyLocation: v.nearbyLocation,
            ownerName: v.ownerName,
            contactPhone: v.contactPhone,
            ownerEmail: v.ownerEmail,
            monthlyRent: v.monthlyRent,
            amenities: v.amenities
        };

        const fieldPhotos = v.photos || [];
        const profPhotos = v.professionalPhotos || [];
        const isLive = v.isLiveOnWebsite || false;
        const amenities = (prop.amenities || v.amenities || []).length ? (prop.amenities || v.amenities).join(', ') : '-';
        const cleanliness = v.cleanlinessRating || v.cleanliness || '-';
        const ownerBehaviour = v.ownerBehaviourPublic || v.ownerBehaviour || '-';
        const geoOk = (v.latitude && v.longitude) ? 'OK' : 'No Geo';
        const loginId = v.generatedCredentials ? (v.generatedCredentials.loginId || '-') : '-';
        const password = v.generatedCredentials ? (v.generatedCredentials.tempPassword || '-') : '-';

        const visitKey = v.visitId || v._id;
        return `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-3 text-xs font-mono text-gray-600">${v.visitId || v._id.slice(-8).toUpperCase()}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${v.submittedAt ? new Date(v.submittedAt).toLocaleString() : '-'}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-slate-700">${v.staffName || prop.staffName || '-'}</td>
                    <td class="px-4 py-3 text-sm">${v.staffId || prop.staffId || '-'}</td>
                    <td class="px-4 py-3">
                        <div class="text-sm font-bold text-slate-700">${v.propertyName || prop.name || '-'}</div>
                    </td>
                    <td class="px-4 py-3">${v.propertyType || prop.propertyType || '-'}</td>
                    <td class="px-4 py-3">${v.address || prop.address || '-'}</td>
                    <td class="px-4 py-3">${v.area || prop.area || '-'}</td>
                    <td class="px-4 py-3">${v.landmark || prop.landmark || '-'}</td>
                    <td class="px-4 py-3">${v.nearbyLocation || prop.nearbyLocation || '-'}</td>
                    <td class="px-4 py-3">${v.ownerName || prop.ownerName || '-'}</td>
                    <td class="px-4 py-3">${v.contactPhone || prop.contactPhone || '-'}</td>
                    <td class="px-4 py-3">${v.ownerEmail || prop.ownerEmail || '-'}</td>
                    <td class="px-4 py-3">${v.gender || '-'}</td>
                    <td class="px-4 py-3 text-center bg-amber-50 border-x border-amber-200">
                        <div class="flex items-center justify-center">
                            <span class="text-lg font-bold text-amber-600">${v.studentReviewsRating ? `${'★'.repeat(Math.floor(v.studentReviewsRating))}${'☆'.repeat(5 - Math.floor(v.studentReviewsRating))}` : '-'}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-center bg-emerald-50 border-x border-emerald-200">
                        <div class="flex items-center justify-center">
                            <span class="text-lg font-bold text-emerald-600">${v.employeeRating ? `${'★'.repeat(Math.floor(v.employeeRating))}${'☆'.repeat(5 - Math.floor(v.employeeRating))}` : '-'}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-center font-bold">?${v.monthlyRent || prop.monthlyRent || 0}</td>
                    <td class="px-4 py-3 text-sm">${amenities}</td>
                    <td class="px-4 py-3">${cleanliness}</td>
                    <td class="px-4 py-3">${ownerBehaviour}</td>
                    <td class="px-4 py-3">
                        <button onclick='viewGallery(${JSON.stringify(fieldPhotos)})' class="text-[10px] text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-200 font-medium hover:bg-purple-100 transition">
                            ${fieldPhotos.length}
                        </button>
                    </td>
                    <td class="px-4 py-3">
                        <button onclick='viewGallery(${JSON.stringify(profPhotos)})' class="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 font-medium hover:bg-blue-100 transition">
                            ${profPhotos.length}
                        </button>
                    </td>
                    <td class="px-4 py-3">${geoOk}</td>
                    <td class="px-4 py-3">
                        <button onclick="openMap('${visitKey}')" class="text-xs px-2 py-1 bg-gray-50 rounded border text-gray-600 hover:bg-gray-100" ${!(v.latitude && v.longitude) ? 'disabled' : ''}>Map</button>
                    </td>
                    <td class="px-4 py-3">${v.status || '-'}</td>
                    <td class="px-4 py-3 font-mono text-sm text-purple-700">${loginId}</td>
                    <td class="px-4 py-3 font-mono text-sm">${password}</td>
                    <td class="px-4 py-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="approve('${visitKey}')" class="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Approve"><i data-lucide="check" class="w-4 h-4"></i></button>
                            <button onclick="holdVisit('${visitKey}')" class="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors" title="Hold"><i data-lucide="pause" class="w-4 h-4"></i></button>
                        </div>
                    </td>
                </tr>`;
    }).join('');

    console.log('? Table rendered successfully with', visits.length, 'rows');
    lucide.createIcons();
    renderStatusCounters();
    console.log('? fetchEnquiries() completed');
}

function toggleWebStatus(id) {
    let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
    let sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');

    // Merge both sources first
    if (sessionVisits.length > 0) {
        const merged = [...visits];
        sessionVisits.forEach(sv => {
            const existing = merged.find(v => v._id === sv._id);
            if (!existing) {
                merged.push(sv);
            } else {
                Object.assign(existing, sv);
            }
        });
        visits = merged;
    }

    const idx = visits.findIndex(v => v._id === id);
    if (idx !== -1) {
        visits[idx].isLiveOnWebsite = !visits[idx].isLiveOnWebsite;
        if (window.safeStorage) { window.safeStorage.setVisits(visits); } else { localStorage.setItem('roomhy_visits', JSON.stringify(visits)); }
        fetchEnquiries();
        const msg = visits[idx].isLiveOnWebsite ? "Property is now LIVE on website." : "Property taken offline.";
        alert(msg);
    }
}

function renderStatusCounters() {
    const visits = readVisitsFromStorage();
    document.getElementById('approvedCount').innerText = visits.filter(v => v.status === 'approved').length;
    document.getElementById('holdCount').innerText = visits.filter(v => v.status === 'hold').length;
    document.getElementById('rejectedCount').innerText = visits.filter(v => v.status === 'rejected').length;
}

// Room approvals: render notifications of type room_add / bed_add
function fetchRoomApprovals() {
    const tbody = document.getElementById('roomApprovalsBody');
    if (!tbody) return;
    let visits = readVisitsFromStorage();

    // Filter for room/bed notifications pending approval
    const pending = visits.filter(v => v.status === 'pending' && (v.type === 'room_add' || v.type === 'bed_add'));
    if (!pending || pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-12 text-center text-gray-400">No room approvals pending.</td></tr>';
        return;
    }

    tbody.innerHTML = pending.map(n => {
        const owner = n.submittedBy || (n.propertyInfo && n.propertyInfo.ownerName) || '-';
        const roomNo = (n.room && (n.room.number || n.room.id)) || '-';
        const rent = (n.room && (n.room.rent !== undefined ? n.room.rent : '-')) || '-';
        return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm">${owner}</td>
                    <td class="px-6 py-4 text-sm font-mono">${roomNo}</td>
                    <td class="px-6 py-4 text-right font-bold">?${rent}</td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="approveRoomNotification('${n._id}')" class="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">Approve</button>
                            <button onclick="rejectRoomNotification('${n._id}')" class="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">Reject</button>
                        </div>
                    </td>
                </tr>`;
    }).join('');
}

function approveRoomNotification(id) {
    try {
        let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
        let sessionVisits = [];
        try { sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]'); } catch (e) { }
        if (sessionVisits.length > 0) {
            const merged = [...visits];
            sessionVisits.forEach(sv => { const existing = merged.find(v => v._id === sv._id); if (!existing) merged.push(sv); else Object.assign(existing, sv); });
            visits = merged;
        }
        const idx = visits.findIndex(v => v._id === id);
        if (idx === -1) return alert('Notification not found');
        const notif = visits[idx];
        // mark notification approved
        visits[idx].status = 'approved';

        // If it's a room_add or bed_add, update the room record in roomhy_rooms
        try {
            let rooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
            if (notif.type === 'room_add' && notif.room && notif.room.id) {
                const rIdx = rooms.findIndex(r => r.id === notif.room.id);
                if (rIdx !== -1) {
                    rooms[rIdx].approvalStatus = 'approved';
                }
            }
            if (notif.type === 'bed_add' && notif.room && notif.room.id) {
                const rIdx = rooms.findIndex(r => r.id === notif.room.id);
                if (rIdx !== -1) {
                    // mark as pending-approval -> approved
                    rooms[rIdx].approvalStatus = 'approved';
                }
            }
            localStorage.setItem('roomhy_rooms', JSON.stringify(rooms));
        } catch (err) { console.error('Failed updating room approval:', err); }

        localStorage.setItem('roomhy_visits', JSON.stringify(visits));
        try { sessionStorage.setItem('roomhy_visits', JSON.stringify(visits)); } catch (e) { }
        fetchRoomApprovals();
        fetchEnquiries();
        alert('? Approved');
    } catch (err) { console.error('approveRoomNotification error:', err); alert('Error approving notification'); }
}

function rejectRoomNotification(id) {
    try {
        let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
        let sessionVisits = [];
        try { sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]'); } catch (e) { }
        if (sessionVisits.length > 0) {
            const merged = [...visits];
            sessionVisits.forEach(sv => { const existing = merged.find(v => v._id === sv._id); if (!existing) merged.push(sv); else Object.assign(existing, sv); });
            visits = merged;
        }
        const idx = visits.findIndex(v => v._id === id);
        if (idx === -1) return alert('Notification not found');
        visits[idx].status = 'rejected';
        localStorage.setItem('roomhy_visits', JSON.stringify(visits));
        try { sessionStorage.setItem('roomhy_visits', JSON.stringify(visits)); } catch (e) { }
        fetchRoomApprovals();
        fetchEnquiries();
        alert('⛔ Rejected');
    } catch (err) { console.error('rejectRoomNotification error:', err); alert('Error rejecting notification'); }
}

async function approve(id) {
    currentApprovingId = id;
    document.getElementById('approveModal').classList.remove('hidden');
    document.getElementById('approveModal').classList.add('flex');
}

/**
 * SEND OWNER CREDENTIALS EMAIL
 * Sends generated login credentials to the property owner
 */
async function sendOwnerCredentialsEmail(email, name, loginId, password, area = '') {
    try {
        const checkinBase = 'http://localhost:5173';
        const checkinLink = `${checkinBase}/digital-checkin/ownerprofile?loginId=${encodeURIComponent(loginId)}&email=${encodeURIComponent(email)}&area=${encodeURIComponent(area)}&password=${encodeURIComponent(password)}`;
        const mainCheckinLink = `${checkinBase}/digital-checkin/index`;
        const response = await fetch(API_URL + '/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: email,
                subject: '?? Your Property Approved! Login Credentials Inside',
                html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <style>
                                    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
                                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                                    .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                                    .header h1 { margin: 0; font-size: 28px; }
                                    .content { padding: 30px; background: #f8fafc; }
                                    .credentials { background: white; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
                                    .credentials p { margin: 10px 0; }
                                    .label { font-weight: bold; color: #2563eb; }
                                    .button { display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 5px 10px 0; }
                                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #eee; }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <h1>?? Your Property is Approved!</h1>
                                    </div>
                                    <div class="content">
                                        <p>Hi <strong>${name}</strong>,</p>
                                        <p>Great news! Your property has been approved and is now live on Roomhy. Here are your login credentials to manage your property:</p>
                                        
                                        <div class="credentials">
                                            <p><span class="label">Login ID:</span> <strong>${loginId}</strong></p>
                                            <p><span class="label">Temporary Password:</span> <strong>${password}</strong></p>
                                            <p><span class="label">Area:</span> <strong>${area || 'N/A'}</strong></p>
                                        </div>

                                        <p style="margin-top: 20px;"><strong>?? Digital Check-In Links:</strong></p>
                                        <p>
                                            <a href="${mainCheckinLink}" class="button">Digital Check-In (Main)</a><br>
                                            <a href="${checkinLink}" class="button">Owner Check-In (Direct)</a>
                                        </p>

                                        <p style="color: #d32f2f; font-weight: bold;">?? Important: Please change your password on first login for security.</p>

                                        <p>You can now log in to your property owner dashboard to manage bookings, view inquiries, and track your property performance.</p>

                                        <p style="margin-top: 30px;">If you have any questions, feel free to contact our support team at <strong>team@roomhy.com</strong></p>
                                    </div>
                                    <div class="footer">
                                        <p>&copy; 2025 Roomhy. All rights reserved. | Made for property owners</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        `,
                text: `Your Property Approved!\n\nHi ${name},\n\nYour property has been approved and is now live on Roomhy.\n\nLogin Credentials:\nLogin ID: ${loginId}\nTemporary Password: ${password}\nArea: ${area || 'N/A'}\n\nDigital Check-In Link:\n${checkinLink}\n\nPlease change your password on first login for security.\n\nQuestions? Contact us at team@roomhy.com\n\n 2025 Roomhy. All rights reserved.`
            })
        });
        if (response.ok) {
            console.log('? Owner credentials email sent successfully');
        } else {
            console.warn('?? Failed to send owner credentials email');
        }
    } catch (err) {
        console.warn('?? Email sending error:', err.message);
    }
}

async function confirmApproval(shouldUpload) {
    console.log('?? confirmApproval called with shouldUpload:', shouldUpload, 'currentApprovingId:', currentApprovingId);

    if (!currentApprovingId) {
        console.error('? No visit ID to approve');
        return;
    }

    let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
    let sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');

    // Merge both sources first
    if (sessionVisits.length > 0) {
        const merged = [...visits];
        sessionVisits.forEach(sv => {
            const existing = merged.find(v => v._id === sv._id);
            if (!existing) {
                merged.push(sv);
            } else {
                Object.assign(existing, sv);
            }
        });
        visits = merged;
    }

    // Find visit in storage - check both _id and visitId fields
    const idx = visits.findIndex(v => v._id === currentApprovingId || v.visitId === currentApprovingId);
    let visitData = null;

    if (idx !== -1) {
        visitData = visits[idx];
        console.log('? Visit found at index', idx, '- Setting status to approved');
    } else {
        console.warn('?? Visit not found in storage - will proceed with API call only');
        // Create a minimal visit object for API call
        visitData = { _id: currentApprovingId, visitId: currentApprovingId };
    }

    const loginId = `ROOMHY${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const password = Math.random().toString(36).slice(-8);
    let finalLoginId = loginId;
    let finalPassword = password;
    let backendEmailSent = false;
    let approvedVisitFromBackend = null;

    // Update status in storage if found
    if (idx !== -1) {
        visits[idx].status = 'approved';
        visits[idx].isLiveOnWebsite = shouldUpload;
        visits[idx].generatedCredentials = { loginId, tempPassword: password };
        // Also store the owner name for quick retrieval by the owner
        if (!visits[idx].ownerName) {
            visits[idx].ownerName = visitData?.ownerName ||
                (visitData?.propertyInfo && visitData.propertyInfo.ownerName) ||
                visitData?.owner ||
                visitData?.contactPerson ||
                visitData?.name ||
                visitData?.submittedBy ||
                'Owner';
        }
        if (window.safeStorage) { window.safeStorage.setVisits(visits); } else { localStorage.setItem('roomhy_visits', JSON.stringify(visits)); }
        try { sessionStorage.setItem('roomhy_visits', JSON.stringify(visits)); } catch (e) { }
    }

    // Always sync approval with backend API
    console.log('?? Syncing to backend API:', API_URL + '/api/visits/approve');
    try {
        // Extract owner name from visit data
        const ownerName = visitData?.ownerName ||
            (visitData?.propertyInfo && visitData.propertyInfo.ownerName) ||
            visitData?.owner ||
            visitData?.contactPerson ||
            visitData?.name ||
            visitData?.submittedBy ||
            'Owner';

        const payload = {
            visitId: currentApprovingId,
            status: 'approved',
            isLiveOnWebsite: shouldUpload,
            loginId: loginId,
            tempPassword: password,
            ownerName: ownerName, // ADD OWNER NAME TO PAYLOAD
            name: ownerName // Also send as 'name' for backend flexibility
        };
        console.log('?? Sending payload:', payload);

        const response = await fetch(API_URL + '/api/visits/approve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': sessionStorage.getItem('token') || localStorage.getItem('token') || ''
            },
            body: JSON.stringify(payload)
        });

        console.log('?? Backend response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`? API Error ${response.status}: ${errorText}`);
            console.warn(`API Error ${response.status}: ${response.statusText} from ${API_URL}/api/visits/approve`);
        } else {
            const data = await response.json();
            console.log('? Visit approved and synced to backend:', data);
            // Prefer backend-returned credentials (backend enforces uniqueness/format)
            finalLoginId = data?.credentials?.loginId || finalLoginId;
            finalPassword = data?.credentials?.tempPassword || finalPassword;
            backendEmailSent = !!(data?.email && data.email.sent);
            approvedVisitFromBackend = data?.visit || null;
        }
    } catch (err) {
        console.error('? Backend sync error:', err);
        console.warn('Backend sync failed:', err.message);
    }

    // Keep local cache in sync with final credentials
    if (idx !== -1) {
        visits[idx].generatedCredentials = { loginId: finalLoginId, tempPassword: finalPassword };
        if (window.safeStorage) { window.safeStorage.setVisits(visits); } else { localStorage.setItem('roomhy_visits', JSON.stringify(visits)); }
        try { sessionStorage.setItem('roomhy_visits', JSON.stringify(visits)); } catch (e) { }
    } else {
        // If not present locally, add backend visit data (not minimal shadow) to preserve identity fields.
        const shadow = approvedVisitFromBackend ? {
            ...approvedVisitFromBackend,
            _id: approvedVisitFromBackend.visitId || approvedVisitFromBackend._id || currentApprovingId,
            visitId: approvedVisitFromBackend.visitId || currentApprovingId,
            status: 'approved',
            isLiveOnWebsite: shouldUpload,
            generatedCredentials: { loginId: finalLoginId, tempPassword: finalPassword }
        } : {
            _id: currentApprovingId,
            visitId: currentApprovingId,
            status: 'approved',
            isLiveOnWebsite: shouldUpload,
            generatedCredentials: { loginId: finalLoginId, tempPassword: finalPassword },
            approvedAt: new Date().toISOString(),
            submittedAt: new Date().toISOString()
        };
        visits.push(shadow);
        if (window.safeStorage) { window.safeStorage.setVisits(visits); } else { localStorage.setItem('roomhy_visits', JSON.stringify(visits)); }
        try { sessionStorage.setItem('roomhy_visits', JSON.stringify(visits)); } catch (e) { }
    }

    document.getElementById('modalLoginId').innerText = finalLoginId;
    document.getElementById('modalPassword').innerText = finalPassword;

    // Send email with owner credentials
    const ownerEmail =
        visitData.ownerEmail ||
        (visitData.propertyInfo && (visitData.propertyInfo.ownerEmail || visitData.propertyInfo.ownerGmail)) ||
        visitData.email;
    const ownerName = visitData.ownerName || visitData.name || 'Owner';
    const ownerArea = visitData.area || (visitData.propertyInfo && visitData.propertyInfo.area) || '';
    if (ownerEmail && !backendEmailSent) {
        console.log('?? Sending credentials email (fallback) to:', ownerEmail);
        sendOwnerCredentialsEmail(ownerEmail, ownerName, finalLoginId, finalPassword, ownerArea);
    } else {
        if (!ownerEmail) console.warn('?? No owner email found for', currentApprovingId);
        if (backendEmailSent) console.log('? Backend already sent credentials email');
    }

    document.getElementById('approveModal').classList.add('hidden');
    document.getElementById('successModal').classList.remove('hidden');
    document.getElementById('successModal').classList.add('flex');
    try { localStorage.setItem('roomhy_visits_last_updated', new Date().toISOString()); } catch (e) { }
    fetchEnquiries();

    currentApprovingId = null;
}

async function holdVisit(id) {
    const reason = prompt("Enter hold reason:");
    if (reason === null) return;

    try {
        const response = await fetch(API_URL + '/api/visits/hold', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': sessionStorage.getItem('token') || localStorage.getItem('token') || ''
            },
            body: JSON.stringify({
                visitId: id,
                holdReason: reason
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Visit held successfully');
            fetchEnquiries();
        } else {
            alert('Error holding visit: ' + data.message);
        }
    } catch (error) {
        console.error('Error holding visit:', error);
        alert('Error holding visit: ' + error.message);
    }
}

function closeModal() { document.getElementById('successModal').classList.add('hidden'); fetchEnquiries(); }

function viewGallery(photos) {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = (photos && photos.length) ? photos.map(src => `<img src="${src}" class="w-full h-48 object-cover rounded-xl shadow-lg border border-gray-200">`).join('') : '<p class="text-white text-center py-20">No images available for this section.</p>';
    document.getElementById('imageModal').classList.remove('hidden');
    document.getElementById('imageModal').classList.add('flex');
}

function closeImageModal() { document.getElementById('imageModal').classList.add('hidden'); }

function openMap(id) {
    let visits = readVisitsFromStorage();
    const v = visits.find(x => x._id === id);
    if (!v || !v.latitude || !v.longitude) {
        alert('No geo-location available for this visit.');
        return;
    }
    const url = `https://www.google.com/maps?q=${v.latitude},${v.longitude}`;
    window.open(url, '_blank');
}

const initEnquiryPage = () => {
    console.log('?? Super Admin Enquiry Page Loaded');
    console.log('?? URL:', window.location.href);
    fetchEnquiries();
    // Auto-refresh enquiries every 15 seconds to show newly created visits
    const refreshInterval = setInterval(() => {
        console.log('? Auto-refresh: fetching latest enquiries');
        fetchEnquiries();
    }, 15000); // 15 seconds

    // Clean up interval on page unload
    window.addEventListener('beforeunload', () => clearInterval(refreshInterval));
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnquiryPage);
} else {
    initEnquiryPage();
}



