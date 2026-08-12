lucide.createIcons();
        let currentTenantId = null;
        let currentTenantData = null;

        // Sidebar Toggle
        function toggleSubmenu(id, element) {
            const submenu = document.getElementById(id);
            const chevron = element.querySelector('.lucide-chevron-down');
            if (submenu.classList.contains('open')) {
                submenu.classList.remove('open');
                chevron.style.transform = 'rotate(0deg)';
            } else {
                submenu.classList.add('open');
                chevron.style.transform = 'rotate(180deg)';
            }
        }
        
        // Mobile menu is now handled by mobile-sidebar.js
        // This function delegates to the global mobile sidebar handler
        function toggleMobileMenu() {
            const mobileSidebar = document.getElementById('mobile-sidebar');
            const overlay = document.getElementById('mobile-sidebar-overlay');
            
            if (!mobileSidebar || !overlay) return;
            
            // Check current state
            const isHidden = mobileSidebar.classList.contains('-translate-x-full') || 
                           mobileSidebar.classList.contains('hidden');
            
            if (isHidden) {
                // Open sidebar
                mobileSidebar.classList.remove('-translate-x-full');
                mobileSidebar.classList.remove('hidden');
                overlay.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            } else {
                // Close sidebar
                mobileSidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
                document.body.style.overflow = '';
            }
        }

        // Add event listener for mobile menu (fallback if mobile-sidebar.js not loaded)
        try {
            const menuBtn = document.getElementById('mobile-menu-open');
            if (menuBtn && !menuBtn._mobileMenuListenerAdded) {
                menuBtn.addEventListener('click', toggleMobileMenu);
                menuBtn._mobileMenuListenerAdded = true;
            }
        } catch (e) {
            console.debug('Mobile menu setup skipped:', e);
        }

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
             e.preventDefault();
             window.location.href = '/superadmin/index';
        });

        // Load Tenants
        document.addEventListener('DOMContentLoaded', () => {
            loadTenants();
        });

        function getImageDataUrl(fileLike) {
            if (!fileLike) return '';
            if (typeof fileLike === 'string') return fileLike;
            if (typeof fileLike === 'object' && fileLike.dataUrl) return fileLike.dataUrl;
            return '';
        }

        function getProfilePropertyName(tenant) {
            if (!tenant) return '';
            const tenantProfileName = tenant.tenantProfile && tenant.tenantProfile.propertyName;
            const digitalProfileName = tenant.digitalCheckin && tenant.digitalCheckin.profile && tenant.digitalCheckin.profile.propertyName;
            return tenantProfileName || digitalProfileName || '';
        }

        function normalizeTenantRecord(t) {
            const profile = (t && t.digitalCheckin && t.digitalCheckin.profile) || {};
            const tenantProfile = (t && t.tenantProfile) || {};
            const kyc = (t && t.digitalCheckin && t.digitalCheckin.kyc) || {};
            const propertyObj = (t && t.property && typeof t.property === 'object') ? t.property : null;
            // Prefer tenant-profile-entered property name over populated property document title.
            const propertyTitle = getProfilePropertyName(t) || t.propertyTitle || t.propertyName || (propertyObj && (propertyObj.title || propertyObj.name)) || '';
            const aadhaarNumber = (t.kyc && (t.kyc.aadhaarNumber || t.kyc.aadhar)) || kyc.aadhaarNumber || '';
            const aadhaarFront = (t.kyc && (t.kyc.idProofFile || t.kyc.aadhaarFront || t.kyc.aadharFile)) || kyc.aadhaarFront || '';
            const aadhaarBack = (t.kyc && t.kyc.aadhaarBack) || kyc.aadhaarBack || '';

            return {
                ...t,
                name: t.name || profile.name || tenantProfile.name || '',
                email: t.email || profile.email || tenantProfile.email || '',
                phone: t.phone || profile.aadhaarLinkedPhone || tenantProfile.aadhaarLinkedPhone || tenantProfile.phone || '',
                dob: t.dob || profile.dob || tenantProfile.dob || '',
                guardianNumber: t.guardianNumber || profile.guardianNumber || tenantProfile.guardianNumber || t.emergencyContact || '',
                moveInDate: t.moveInDate || profile.moveInDate || tenantProfile.moveInDate || '',
                roomNo: t.roomNo || profile.roomNo || tenantProfile.roomNo || '',
                agreedRent: (t.agreedRent !== undefined && t.agreedRent !== null) ? t.agreedRent : (profile.agreedRent || tenantProfile.agreedRent || 0),
                property: propertyObj || propertyTitle || t.property || '',
                kycStatus: t.kycStatus || ((t.kyc && t.kyc.otpVerified) || kyc.otpVerified ? 'verified' : 'pending'),
                kyc: {
                    ...(t.kyc || {}),
                    aadhar: aadhaarNumber,
                    aadhaarNumber: aadhaarNumber,
                    aadhaarLinkedPhone: (t.kyc && t.kyc.aadhaarLinkedPhone) || kyc.aadhaarLinkedPhone || '',
                    idProofFile: getImageDataUrl(aadhaarFront),
                    aadhaarFront: aadhaarFront,
                    aadhaarBack: aadhaarBack
                }
            };
        }

        function resolveTenantPropertyText(t) {
            if (!t) return 'Unknown Property';
            const profilePropertyTitle = getProfilePropertyName(t);
            if (profilePropertyTitle) return profilePropertyTitle;

            const directTitle = t.propertyTitle || t.propertyName || '';
            if (directTitle) return directTitle;

            const roomAssignedProperty = getAssignedPropertyFromRooms(t);
            if (roomAssignedProperty) return roomAssignedProperty;

            const propObj = (t.property && typeof t.property === 'object') ? t.property : null;
            if (propObj) {
                const title = propObj.title || propObj.name || '';
                if (title) return title + (propObj.locationCode ? ` (${propObj.locationCode})` : '');
            }

            if (typeof t.property === 'string') {
                const raw = String(t.property).trim();
                // Ignore Mongo ObjectId-like values shown to users.
                if (!/^[a-f0-9]{24}$/i.test(raw) && raw) return raw;
            }

            return 'Unknown Property';
        }

        function getRoomAssignmentForTenant(tenant) {
            if (!tenant) return null;
            try {
                const rooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
                if (!Array.isArray(rooms) || rooms.length === 0) return null;

                const tenantKeys = [
                    tenant.loginId,
                    tenant.id,
                    tenant._id,
                    tenant.dbId
                ]
                    .filter(Boolean)
                    .map(v => String(v).toUpperCase());

                const roomNo = String(tenant.roomNo || '').trim();
                const bedNo = String(tenant.bedNo || '').trim();

                for (const room of rooms) {
                    const beds = Array.isArray(room.beds) ? room.beds : [];
                    for (let i = 0; i < beds.length; i++) {
                        const bed = beds[i] || {};
                        if (String(bed.status || '').toLowerCase() !== 'occupied') continue;

                        const bedTenantId = String(bed.tenantId || '').toUpperCase();
                        const bedMatchesTenant = bedTenantId && tenantKeys.includes(bedTenantId);
                        const slotMatchesTenant = roomNo && String(room.number || '').trim() === roomNo
                            && (!bedNo || String(i + 1) === bedNo || String.fromCharCode(65 + i) === bedNo.toUpperCase());

                        if (bedMatchesTenant || slotMatchesTenant) {
                            return { room, bedIndex: i };
                        }
                    }
                }
            } catch (_) {}
            return null;
        }

        function getAssignedPropertyFromRooms(tenant) {
            const assignment = getRoomAssignmentForTenant(tenant);
            if (!assignment) return '';

            const room = assignment.room || {};
            const fromRoom = String(room.propertyTitle || room.propertyName || '').trim();
            if (fromRoom) return fromRoom;

            const propertyId = String(room.propertyId || '').trim();
            if (!propertyId) return '';

            try {
                const props = JSON.parse(localStorage.getItem('roomhy_properties') || '[]');
                if (!Array.isArray(props)) return '';
                const found = props.find(p => {
                    const pid = String(p && (p._id || p.id || p.propertyId || '')).trim();
                    return pid && pid === propertyId;
                });
                return found ? String(found.title || found.name || found.propertyName || '').trim() : '';
            } catch (_) {
                return '';
            }
        }

        function loadTenants() {
            // Try backend first (requires superadmin token), fallback to localStorage
            let tenants = [];
            (async () => {
                let cachedTenants = [];
                try {
                    cachedTenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
                } catch (_) {
                    cachedTenants = [];
                }
                const deletedTenantIds = new Set(
                    (JSON.parse(localStorage.getItem('roomhy_deleted_tenants') || '[]') || [])
                        .map(v => String(v || '').toUpperCase())
                        .filter(Boolean)
                );
                const cachedByLoginId = new Map(
                    (Array.isArray(cachedTenants) ? cachedTenants : [])
                        .filter(t => t && t.loginId)
                        .map(t => [String(t.loginId).toUpperCase(), t])
                );

                try {
                    const token = localStorage.getItem('token');
                    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
                    const res = await fetch(API_URL + '/api/tenants', { headers });
                    if (res.ok) {
                        const data = await res.json();
                        const raw = Array.isArray(data) ? data : (Array.isArray(data.tenants) ? data.tenants : []);
                        tenants = raw.map(normalizeTenantRecord).filter((t) => {
                            const key = String(t.loginId || '').toUpperCase();
                            const idKey = String(t._id || t.id || t.dbId || '').toUpperCase();
                            return !deletedTenantIds.has(key) && !deletedTenantIds.has(idKey);
                        }).map((t) => {
                            const key = String(t.loginId || '').toUpperCase();
                            const cached = cachedByLoginId.get(key);
                            if (!cached) return t;

                            const cachedProfileName = getProfilePropertyName(cached);
                            const cachedDirectName = cached.propertyTitle || cached.propertyName || '';
                            const cachedPropertyName = cachedProfileName || cachedDirectName;

                            if (!cachedPropertyName) return t;

                            // Preserve tenantprofile-entered property name when API returns stale assignment title.
                            t.propertyTitle = cachedPropertyName;
                            t.propertyName = cachedPropertyName;
                            t.digitalCheckin = t.digitalCheckin || {};
                            t.digitalCheckin.profile = t.digitalCheckin.profile || {};
                            if (!t.digitalCheckin.profile.propertyName || t.digitalCheckin.profile.propertyName !== cachedPropertyName) {
                                t.digitalCheckin.profile.propertyName = cachedPropertyName;
                            }
                            t.tenantProfile = t.tenantProfile || {};
                            if (!t.tenantProfile.propertyName || t.tenantProfile.propertyName !== cachedPropertyName) {
                                t.tenantProfile.propertyName = cachedPropertyName;
                            }
                            return t;
                        }).map((t) => {
                            const assignment = getRoomAssignmentForTenant(t);
                            if (!assignment) return t;

                            const room = assignment.room || {};
                            const bedIndex = assignment.bedIndex;
                            const assignedProperty = getAssignedPropertyFromRooms(t);

                            const profilePropertyName = getProfilePropertyName(t);
                            if (assignedProperty && !profilePropertyName) {
                                t.propertyTitle = assignedProperty;
                                t.propertyName = assignedProperty;
                                t.digitalCheckin = t.digitalCheckin || {};
                                t.digitalCheckin.profile = t.digitalCheckin.profile || {};
                                if (!t.digitalCheckin.profile.propertyName || t.digitalCheckin.profile.propertyName !== assignedProperty) {
                                    t.digitalCheckin.profile.propertyName = assignedProperty;
                                }
                            }

                            if (!t.roomNo) t.roomNo = room.number || t.roomNo;
                            if (!t.bedNo) t.bedNo = String((bedIndex || 0) + 1);

                            return t;
                        });
                        if (tenants.length > 0) {
                            localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                        }
                    }
                } catch (err) {
                    console.warn('Failed to fetch tenants from API, falling back to localStorage', err);
                }

                if (!tenants || tenants.length === 0) {
                    tenants = [];
                }
                window.__tenantCache = tenants;

                const tbody = document.getElementById('all-tenants-body');
                tbody.innerHTML = '';
                // Filter Logic
                const search = document.getElementById('areaSearch').value.toLowerCase();
                const filteredTenants = tenants.filter(t => {
                    const status = String(t.status || '').toLowerCase();
                    const hasAssignment = Boolean((t.roomNo && String(t.roomNo).trim()) || (t.bedNo && String(t.bedNo).trim()));
                    if (status === 'moved_out' || !hasAssignment) return false;

                    const prop = resolveTenantPropertyText(t);
                    const area = (t.address || '').toLowerCase();
                    return (prop.toLowerCase().includes(search) || area.includes(search));
                });

                if(filteredTenants.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No tenants found matching criteria.</td></tr>';
                    return;
                }
                // expose filtered set for export
                window.tenantsForExport = filteredTenants;

                filteredTenants.forEach(t => {
                    let kycBadge = '';
                    let actionButtons = '';

                    // Badge Logic
                    if(t.kycStatus === 'submitted') {
                        kycBadge = '<span class="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">Review Pending</span>';
                        actionButtons = `
                            <button onclick="openVerifyModal('${t.loginId}')" class="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1">
                                Review KYC
                            </button>
                        `;
                    } else if(t.kycStatus === 'verified') {
                        kycBadge = '<span class="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Verified</span>';
                        actionButtons = '<span class="text-xs text-green-600 font-medium flex items-center justify-end"><i data-lucide="check-circle" class="w-4 h-4 mr-1"></i> Approved</span>';
                    } else if(t.kycStatus === 'rejected') {
                        kycBadge = '<span class="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Rejected</span>';
                        actionButtons = '<span class="text-xs text-red-600 font-medium">Rejected</span>';
                    } else {
                        kycBadge = '<span class="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Not Submitted</span>';
                        actionButtons = '<span class="text-xs text-gray-400">Waiting for upload</span>';
                    }

                    let propDisplay = resolveTenantPropertyText(t);
                    let moveIn = t.moveInDate ? new Date(t.moveInDate).toLocaleDateString() : '-';
                    let moveOut = t.moveOutDate ? new Date(t.moveOutDate).toLocaleDateString() : '<button onclick="moveOutTenant(\'' + t.loginId + '\')" class="text-xs text-red-600 hover:underline">Move Out</button>';
                    if(t.status === 'moved_out') moveOut = `<span class="text-red-600 font-medium text-xs">Left: ${t.moveOutDate ? new Date(t.moveOutDate).toLocaleDateString() : '-'}</span>`;

                    const row = `
                        <tr class="hover:bg-gray-50 border-b border-gray-100 transition-colors">
                            <td>
                                <div class="flex items-center">
                                    <div class="h-9 w-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3 text-sm border border-purple-200 shadow-sm">${(t.name||'')[0] || ''}</div>
                                    <div>
                                        <div class="text-sm font-medium text-gray-900">${t.name}</div>
                                        <div class="text-xs text-gray-500">${t.phone}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="flex flex-col">
                                    <span class="text-sm text-gray-800 font-medium">${propDisplay}</span>
                                    <span class="text-xs text-gray-500">Room ${t.roomNo || '-'}, Bed ${t.bedNo || '-'}</span>
                                </div>
                            </td>
                            <td>${kycBadge}</td>
                            <td>
                                <div class="text-xs text-gray-600">
                                    <div class="mb-1"><strong>In:</strong> ${moveIn}</div>
                                    <div><strong>Out:</strong> ${moveOut}</div>
                                </div>
                            </td>
                            <td class="text-right flex items-center justify-end gap-2 py-4">
                                ${actionButtons}
                                <button onclick="deleteTenant('${t.loginId || ''}','${t._id || t.id || t.dbId || ''}')" class="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition" title="Delete Tenant">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
                lucide.createIcons();
            })();
                
        }

        function filterTenants() {
            loadTenants();
        }

        // --- Actions Logic ---

        function moveOutTenant(loginId) {
            if(!confirm("Are you sure you want to move out this tenant? This will block their login access.")) return;
            
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const idx = tenants.findIndex(t => t.loginId === loginId);
            
            if(idx !== -1) {
                tenants[idx].status = 'moved_out'; // Block Access
                tenants[idx].moveOutDate = new Date().toISOString();
                // Also block login capability
                tenants[idx].password = null; // Or a flag like isBlocked = true
                
                localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                loadTenants();
                alert("Tenant moved out successfully.");
            }
        }

        async function deleteTenant(loginId, dbId) {
            if(!confirm("Permanently delete this tenant record?")) return;

            const normalizedLoginId = String(loginId || '').toUpperCase();
            const normalizedDbId = String(dbId || '').trim();
            const tenants = Array.isArray(window.__tenantCache) ? window.__tenantCache : [];
            const target = tenants.find(t =>
                (normalizedLoginId && String(t.loginId || '').toUpperCase() === normalizedLoginId) ||
                (normalizedDbId && String(t._id || t.id || t.dbId || '') === normalizedDbId)
            );

            let deletedInBackend = false;
            try {
                const token = localStorage.getItem('token');
                const backendId = normalizedDbId || (target && (target._id || target.id || target.dbId));
                if (token && backendId) {
                    const res = await fetch(`${API_URL}/api/tenants/${encodeURIComponent(String(backendId))}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    deletedInBackend = res.ok;
                }
            } catch (err) {
                console.warn('Tenant backend delete failed:', err);
            }

            let localTenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            localTenants = (Array.isArray(localTenants) ? localTenants : []).filter(t => {
                const tLogin = String(t.loginId || '').toUpperCase();
                const tId = String(t._id || t.id || t.dbId || '');
                if (normalizedLoginId && tLogin === normalizedLoginId) return false;
                if (normalizedDbId && tId === normalizedDbId) return false;
                return true;
            });
            localStorage.setItem('roomhy_tenants', JSON.stringify(localTenants));

            // Avoid reappearing rows if backend delete is blocked by role/token.
            const deletedIds = JSON.parse(localStorage.getItem('roomhy_deleted_tenants') || '[]');
            const deleteMarker = normalizedLoginId || normalizedDbId;
            let updatedDeletedIds = Array.from(new Set([...(Array.isArray(deletedIds) ? deletedIds : []), deleteMarker]));
            if (deletedInBackend) {
                updatedDeletedIds = updatedDeletedIds.filter(v => String(v || '').toUpperCase() !== String(deleteMarker || '').toUpperCase());
            }
            localStorage.setItem('roomhy_deleted_tenants', JSON.stringify(updatedDeletedIds));

            if (!deletedInBackend) {
                console.warn(`Tenant ${normalizedLoginId} removed only from UI/local cache (backend delete not confirmed).`);
            }

            loadTenants();
        }

        function exportToExcel() {
            const list = window.tenantsForExport || JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            if (!list || list.length === 0) return alert('No data to export.');
            const data = list.map(t => ({
                'Tenant Name': t.name,
                'Login ID': t.loginId,
                'Phone': t.phone,
                'Property': resolveTenantPropertyText(t),
                'Room': t.roomNo || '-',
                'Bed': t.bedNo || '-',
                'KYC Status': t.kycStatus || '-',
                'Move In': t.moveInDate ? new Date(t.moveInDate).toLocaleDateString() : '-',
                'Move Out': t.moveOutDate ? new Date(t.moveOutDate).toLocaleDateString() : '-'
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Tenants');
            const date = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Roomhy_Tenants_${date}.xlsx`);
        }

        // --- Enhanced Modal Logic ---

        function openVerifyModal(loginId) {
            currentTenantId = loginId;
            const tenants = window.__tenantCache || [];
            const tenant = tenants.find(t => t.loginId === loginId);
            currentTenantData = tenant;
            
            if(tenant) {
                // Fill Applicant Details Sidebar
                document.getElementById('detailName').innerText = tenant.name;
                document.getElementById('detailPhone').innerText = tenant.phone;
                document.getElementById('detailLoginId').innerText = tenant.loginId;
                document.getElementById('detailAadhaar').innerText = (tenant.kyc && tenant.kyc.aadhar) ? tenant.kyc.aadhar : 'N/A';
                document.getElementById('detailGuardian').innerText = tenant.guardianNumber || tenant.emergencyContact || 'Not Provided';
                document.getElementById('detailJoinDate').innerText = tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : '-';
                const propDisplay = resolveTenantPropertyText(tenant);
                document.getElementById('detailProperty').innerText = `${propDisplay} (Rm ${tenant.roomNo})`;

                // Load Image
                updateDocView('aadhaar_front');
                
                // Setup Actions
                document.getElementById('approveBtn').onclick = () => processKYC(loginId, 'verified');
                document.getElementById('rejectBtn').onclick = () => processKYC(loginId, 'rejected');

                document.getElementById('kycModal').classList.remove('hidden');
                document.getElementById('kycModal').classList.add('flex');
            }
        }

        function switchDocTab(tabName) {
            document.querySelectorAll('.doc-tab-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            updateDocView(tabName);
        }

        function updateDocView(tabName) {
            const img = document.getElementById('docPreviewImg');
            const placeholder = document.getElementById('noDocPlaceholder');
            
            let imgSrc = null;
            if (tabName === 'aadhaar_front' && currentTenantData.kyc && currentTenantData.kyc.idProofFile) {
                imgSrc = currentTenantData.kyc.idProofFile;
            } else if (tabName === 'aadhaar_back' && currentTenantData.kyc && currentTenantData.kyc.aadhaarBack) {
                imgSrc = getImageDataUrl(currentTenantData.kyc.aadhaarBack);
            }
            // Add logic for other docs if implemented

            if (imgSrc) {
                img.src = imgSrc;
                img.classList.remove('hidden');
                placeholder.classList.add('hidden');
            } else {
                img.classList.add('hidden');
                placeholder.classList.remove('hidden');
                placeholder.querySelector('span').innerText = `No document uploaded for ${tabName.replace('_', ' ')}`;
            }
        }

        function closeKycModal() {
            document.getElementById('kycModal').classList.add('hidden');
            document.getElementById('kycModal').classList.remove('flex');
            currentTenantId = null;
        }

        function processKYC(loginId, status) {
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const index = tenants.findIndex(t => t.loginId === loginId);
            
            if (index !== -1) {
                tenants[index].kycStatus = status;
                if(status === 'verified' && tenants[index].agreementSigned) {
                    tenants[index].status = 'active';
                }
                localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                alert(`Tenant KYC has been ${status.toUpperCase()}.`);
                closeKycModal();
                loadTenants();
            }
        }



