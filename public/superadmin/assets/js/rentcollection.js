// --- Sidebar Submenu Toggle ---
        function toggleSubmenu(id, element) {
            const submenu = document.getElementById(id);
            const chevron = element.querySelector('.lucide-chevron-down');
            
            // Close all other submenus first
            document.querySelectorAll('.submenu').forEach(sub => {
                if(sub.id !== id) sub.classList.remove('open');
            });
            document.querySelectorAll('.lucide-chevron-down').forEach(ch => {
                if(ch && ch !== chevron) ch.style.transform = 'rotate(0deg)';
            });

            if (submenu.classList.contains('open')) {
                submenu.classList.remove('open');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            } else {
                submenu.classList.add('open');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            }
        }

        // API config for local + render
        const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:5001'
            : 'https://api.roomhy.com';
        let allTenants = [];
        let currentFilter = 'all';
        let refreshInterval = null;

        // Load data on page load
        window.addEventListener('load', loadData);

        // Listen for payment updates from other tabs/windows
        window.addEventListener('storage', function(e) {
            if (e.key === 'roomhy_payment_updated') {
                console.log('📡 Payment update detected, refreshing data...');
                loadData();
                showNotification('Payment status updated!', 'success');
            }
        });

        // Also listen for custom events from same window
        window.addEventListener('paymentUpdated', function(e) {
            console.log('📡 Custom payment update event received');
            loadData();
        });

        // Mobile sidebar toggle
        const mobileMenuOpen = document.getElementById('mobile-menu-open');
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');
        const mobileSidebarClose = document.getElementById('mobile-sidebar-close');

        if (mobileMenuOpen && mobileSidebar && mobileSidebarOverlay && mobileSidebarClose) {
            const openSidebar = () => {
                mobileSidebar.classList.remove('hidden');
                mobileSidebarOverlay.classList.remove('hidden');
                setTimeout(() => {
                    mobileSidebar.classList.remove('-translate-x-full');
                }, 10);
            };

            const closeSidebar = () => {
                mobileSidebar.classList.add('-translate-x-full');
                mobileSidebarOverlay.classList.add('hidden');
                setTimeout(() => {
                    mobileSidebar.classList.add('hidden');
                }, 300);
            };

            mobileMenuOpen.addEventListener('click', openSidebar);
            mobileSidebarClose.addEventListener('click', closeSidebar);
            mobileSidebarOverlay.addEventListener('click', closeSidebar);

            mobileSidebar.querySelectorAll('.sidebar-link').forEach(link => {
                link.addEventListener('click', closeSidebar);
            });
        }

        // Auto-refresh every 30 seconds to show updated payment status
        function startAutoRefresh() {
            if (refreshInterval) clearInterval(refreshInterval);
            refreshInterval = setInterval(() => {
                console.log('🔄 Auto-refreshing rent data...');
                loadData();
            }, 30000); // Refresh every 30 seconds
        }

        async function loadData() {
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('areaAdminToken') || localStorage.getItem('superAdminToken');
                const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
                
                console.log('📡 Fetching tenants from:', API_URL + '/api/tenants');
                const tenantRes = await fetch(`${API_URL}/api/tenants`, { headers });
                
                if (!tenantRes.ok) {
                    throw new Error(`HTTP ${tenantRes.status}: Failed to fetch tenants`);
                }
                
                const tenantData = await tenantRes.json();
                let fetchedTenants = [];
                if (tenantData && tenantData.success && Array.isArray(tenantData.tenants)) {
                    fetchedTenants = tenantData.tenants;
                } else if (Array.isArray(tenantData)) {
                    fetchedTenants = tenantData;
                } else if (tenantData.tenants && Array.isArray(tenantData.tenants)) {
                    fetchedTenants = tenantData.tenants;
                }
                
                console.log('✅ Tenants loaded:', fetchedTenants.length);
                console.log('📊 Sample tenant data:', fetchedTenants[0]);
                
                // Fetch rents
                console.log('📡 Fetching rents from:', API_URL + '/api/rents');
                let fetchedRents = [];
                try {
                    const rentRes = await fetch(`${API_URL}/api/rents`, { headers });
                    
                    if (rentRes.ok) {
                        const rentData = await rentRes.json();
                        if (rentData && rentData.success && Array.isArray(rentData.rents)) {
                            fetchedRents = rentData.rents;
                        } else if (Array.isArray(rentData)) {
                            fetchedRents = rentData;
                        } else if (rentData.rents && Array.isArray(rentData.rents)) {
                            fetchedRents = rentData.rents;
                        }
                        console.log('✅ Rents loaded:', fetchedRents.length);
                        console.log('📊 Sample rent data:', fetchedRents[0]);
                    } else {
                        console.warn('⚠️ Rents endpoint returned:', rentRes.status, '- will display pending status for all tenants');
                    }
                } catch (err) {
                    console.warn('⚠️ Could not fetch rents:', err.message, '- will display pending status for all tenants');
                }

                // Fetch owners
                console.log('📡 Fetching owners from:', API_URL + '/api/owners');
                let fetchedOwners = [];
                try {
                    const ownerRes = await fetch(`${API_URL}/api/owners`, { headers });
                    
                    if (ownerRes.ok) {
                        const ownerData = await ownerRes.json();
                        if (ownerData && ownerData.success && Array.isArray(ownerData.owners)) {
                            fetchedOwners = ownerData.owners;
                        } else if (Array.isArray(ownerData)) {
                            fetchedOwners = ownerData;
                        } else if (ownerData.owners && Array.isArray(ownerData.owners)) {
                            fetchedOwners = ownerData.owners;
                        }
                        console.log('✅ Owners loaded:', fetchedOwners.length);
                        console.log('📊 Sample owner data:', fetchedOwners[0]);
                    } else {
                        console.warn('⚠️ Owners endpoint returned:', ownerRes.status);
                    }
                } catch (err) {
                    console.warn('⚠️ Could not fetch owners:', err.message);
                    // Try fallback from localStorage
                    try {
                        const cachedOwners = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');
                        fetchedOwners = Object.values(cachedOwners).map((owner, idx) => ({
                            loginId: Object.keys(JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}'))[idx],
                            profile: owner.profile || {}
                        }));
                    } catch (e) {}
                }
                
                // Merge tenant, rent, and owner data
                allTenants = mergeTenantsWithRents(fetchedTenants, fetchedRents, fetchedOwners);
                console.log('✅ Merged data:', allTenants.length);
                console.log('📊 Sample merged data:', allTenants[0]);
                
                calculateOverallStats();
                displayTable();
                startAutoRefresh(); // Start auto-refresh after data loads
            } catch (err) {
                console.error('❌ Error loading data:', err);
                document.getElementById('tableBody').innerHTML = `<tr><td colspan="14" class="text-center py-8 text-red-500">Error: ${err.message}</td></tr>`;
            }
        }

        function normKey(value) {
            return (value || '').toString().trim().toUpperCase();
        }

        function mergeProfile(owner) {
            return {
                ...(owner?.profile || {}),
                ...(owner?.bankDetails || {}),
                ...(owner?.bank || {}),
                ...(owner?.payment || {})
            };
        }

        function mergeTenantsWithRents(tenants, rents, owners) {
            // Create rent map by tenantLoginId
            const rentMap = {};
            rents.forEach(rent => {
                if (rent.tenantLoginId) {
                    rentMap[rent.tenantLoginId] = rent;
                }
            });

            // Create owner map by loginId and _id for flexible lookup
            const ownerMap = {};
            owners.forEach(owner => {
                const keys = [
                    owner.loginId,
                    owner.ownerLoginId,
                    owner._id,
                    owner.id,
                    owner.profile?.loginId
                ].filter(Boolean);
                keys.forEach(k => { ownerMap[normKey(k)] = owner; });
            });

            // Merge: for each tenant, add their rent info and owner info
            return tenants.map(tenant => {
                const ownerCandidateKeys = [
                    tenant.propertyOwnerId,
                    tenant.ownerLoginId,
                    tenant.owner_id,
                    tenant.ownerId,
                    tenant?.property?.ownerLoginId,
                    tenant?.property?.owner_id,
                    tenant?.property?.ownerId,
                    tenant?.property?.owner?.loginId,
                    tenant?.property?.owner?._id,
                    tenant?.property?.owner
                ].filter(Boolean);

                let owner = null;
                for (const key of ownerCandidateKeys) {
                    const matched = ownerMap[normKey(key)];
                    if (matched) { owner = matched; break; }
                }
                const profile = mergeProfile(owner);
                
                return {
                    ...tenant,
                    rentAmount: parseFloat(tenant.agreedRent) || 0,
                    rentInfo: rentMap[tenant.loginId] || {
                        paymentStatus: 'pending',
                        paidAmount: 0,
                        totalDue: parseFloat(tenant.agreedRent) || 0
                    },
                    ownerInfo: owner || {
                        name: 'N/A',
                        phone: 'N/A',
                        profile: { bankName: 'N/A', accountNumber: 'N/A', ifscCode: 'N/A', branchName: 'N/A' }
                    },
                    ownerProfile: profile
                };
            });
        }

        function displayTable() {
            const tableBody = document.getElementById('tableBody');

            if (allTenants.length === 0) {
                // Try fallback from localStorage
                const cachedTenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
                if (cachedTenants.length > 0) {
                    console.log('📦 Loading from localStorage cache:', cachedTenants.length);
                    allTenants = cachedTenants;
                } else {
                    tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-500">No tenants found</td></tr>';
                    return;
                }
            }

            // Filter tenants based on current filter
            let filteredTenants = allTenants;
            if (currentFilter === 'paid') {
                filteredTenants = allTenants.filter(t => {
                    const rentInfo = t.rentInfo || {};
                    return rentInfo.paymentStatus === 'paid';
                });
            } else if (currentFilter === 'unpaid') {
                filteredTenants = allTenants.filter(t => {
                    const rentInfo = t.rentInfo || {};
                    return rentInfo.paymentStatus !== 'paid';
                });
            }

            // Update stats
            updateStats(filteredTenants);

            let totalRent = 0;
            const rowsHtml = filteredTenants.map(tenant => {
                const moveInDate = tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : 'N/A';
                const initials = (tenant.name || 'T').split(' ').map(n => n[0]).join('').toUpperCase();
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500'];
                const avatarBg = colors[Math.floor(Math.random() * colors.length)];

                // Payment status from rent info
                const rentInfo = tenant.rentInfo || {};
                const tenantPropertyRaw = (typeof tenant.property === 'object' && tenant.property)
                    ? (tenant.property.title || tenant.property.name || '')
                    : (tenant.property || '');
                const rentPropertyRaw = rentInfo.propertyName || '';
                const isPlaceholderProperty = (value) => {
                    const v = String(value || '').trim().toLowerCase();
                    return !v || v === 'new' || v === 'new property' || v === 'unknown';
                };
                const propertyName = !isPlaceholderProperty(rentPropertyRaw)
                    ? rentPropertyRaw
                    : (!isPlaceholderProperty(tenantPropertyRaw) ? tenantPropertyRaw : 'Unknown Property');
                const paymentStatus = rentInfo.paymentStatus || 'pending';
                const statusBadgeColor = paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                const statusText = paymentStatus === 'paid' ? '✓ Paid' : '✗ Unpaid';
                const rentAmount = parseFloat(tenant.rentAmount || tenant.agreedRent || 0);

                // Accumulate total rent
                totalRent += rentAmount;

                // Room info - try multiple field names
                const roomNo = tenant.roomNo || tenant.room_no || tenant.roomNumber || 'N/A';

                // Owner info
                const ownerInfo = tenant.ownerInfo || {};
                const ownerProfile = tenant.ownerProfile || ownerInfo.profile || {};
                const ownerName = ownerInfo.name || ownerInfo.ownerName || ownerProfile.name || ownerProfile.ownerName || tenant.ownerName || 'N/A';
                const ownerPhone = ownerInfo.phone || ownerInfo.mobile || ownerProfile.phone || ownerProfile.mobile || ownerProfile.contactPhone || 'N/A';
                const bankName = ownerProfile.bankName || ownerProfile.bank || ownerProfile.bank_name || ownerProfile.upiId || ownerProfile.upi || ownerProfile.gpay || ownerProfile.paymentId || 'N/A';
                const accountNumber = ownerProfile.accountNumber || ownerProfile.accountNo || ownerProfile.account_number || 'N/A';
                const ifscCode = ownerProfile.ifscCode || ownerProfile.ifsc || ownerProfile.ifsc_code || 'N/A';
                const branchName = ownerProfile.branchName || ownerProfile.branch || ownerProfile.branch_name || 'N/A';

                return `
                    <tr class="hover:bg-gray-50 transition">
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm whitespace-nowrap">
                            <div class="flex items-center gap-3">
                                <div class="avatar ${avatarBg}">${initials}</div>
                                <span class="font-medium text-gray-900">${tenant.name || 'N/A'}</span>
                            </div>
                        </td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">${tenant.email || 'N/A'}</td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">${tenant.phone || 'N/A'}</td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">${propertyName}</td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">${roomNo}</td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">₹${rentAmount.toLocaleString()}</td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm whitespace-nowrap">
                            <span class="status-badge px-3 py-1 rounded-full font-bold text-xs ${statusBadgeColor}">
                                ${statusText}
                            </span>
                        </td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">${moveInDate}</td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">${ownerName}</td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">${ownerPhone}</td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">${bankName}</td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 font-mono whitespace-nowrap">${accountNumber}</td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 font-mono whitespace-nowrap">${ifscCode}</td>
                        <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">${branchName}</td>
                    </tr>
                `;
            }).join('');

            // Add total row if there are tenants
            const totalRowHtml = filteredTenants.length > 0 ? `
                <tr class="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td colspan="5" class="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm text-gray-900 whitespace-nowrap">Total Rent:</td>
                    <td class="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">₹${totalRent.toLocaleString()}</td>
                    <td colspan="8"></td>
                </tr>
            ` : '';

            tableBody.innerHTML = rowsHtml + totalRowHtml;

            if (filteredTenants.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="14" class="text-center py-8 text-gray-500">No ${currentFilter !== 'all' ? currentFilter : ''} tenants found</td></tr>`;
            }
        }

        function calculateOverallStats() {
            // Calculate totals for ALL tenants (not filtered)
            let overallTotalRent = 0;
            let overallCollected = 0;
            let overallPending = 0;

            allTenants.forEach(t => {
                const rentInfo = t.rentInfo || {};
                const rentAmount = parseFloat(t.rentAmount || t.agreedRent || 0);
                const paid = parseFloat(rentInfo.paidAmount || 0);
                const total = parseFloat(rentInfo.totalDue || rentAmount);
                const pending = total - paid;

                overallTotalRent += rentAmount;
                if (rentInfo.paymentStatus === 'paid') {
                    overallCollected += total;
                } else {
                    overallCollected += paid;
                    overallPending += pending;
                }
            });

            const collectionRate = overallTotalRent > 0 ? Math.round((overallCollected / overallTotalRent) * 100) : 0;

            // Update overall stats display
            document.getElementById('overallTotalRent').textContent = overallTotalRent.toLocaleString();
            document.getElementById('overallCollected').textContent = overallCollected.toLocaleString();
            document.getElementById('overallPending').textContent = overallPending.toLocaleString();
            document.getElementById('collectionRate').textContent = collectionRate;
        }

        function updateStats(tenants) {
            let totalRent = 0;
            let statAmount = 0;
            let statLabel = '';

            if (currentFilter === 'paid') {
                statLabel = 'Total Collected';
                tenants.forEach(t => {
                    const rentInfo = t.rentInfo || {};
                    totalRent += parseFloat(t.rentAmount || t.agreedRent || 0);
                    statAmount += parseFloat(rentInfo.paidAmount || rentInfo.totalDue || 0);
                });
            } else if (currentFilter === 'unpaid') {
                statLabel = 'Total Pending';
                tenants.forEach(t => {
                    const rentInfo = t.rentInfo || {};
                    totalRent += parseFloat(t.rentAmount || t.agreedRent || 0);
                    statAmount += parseFloat(rentInfo.totalDue || 0) - parseFloat(rentInfo.paidAmount || 0);
                });
            } else {
                statLabel = 'Total Collected';
                tenants.forEach(t => {
                    const rentInfo = t.rentInfo || {};
                    totalRent += parseFloat(t.rentAmount || t.agreedRent || 0);
                    if (rentInfo.paymentStatus === 'paid') {
                        statAmount += parseFloat(rentInfo.paidAmount || rentInfo.totalDue || 0);
                    }
                });
            }

            document.getElementById('totalRent').textContent = totalRent.toLocaleString();
            document.getElementById('statAmount').textContent = statAmount.toLocaleString();
            document.getElementById('statLabel').textContent = statLabel;
        }

        function filterPaymentStatus(status) {
            currentFilter = status;
            
            // Update active button
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-filter') === status) {
                    btn.classList.add('active');
                }
            });

            displayTable();
        }

        async function sendReminders() {
            const unpaidTenants = allTenants.filter(t => {
                const rentInfo = t.rentInfo || {};
                return rentInfo.paymentStatus !== 'paid';
            });

            if (unpaidTenants.length === 0) {
                showNotification('No unpaid tenants to send reminders', 'error');
                return;
            }

            if (!confirm(`Send rent reminders to ${unpaidTenants.length} unpaid tenant(s)? Daily reminders will continue until payment.`)) {
                return;
            }

            const btn = document.getElementById('reminderBtn');
            try {
                if (btn) {
                    btn.disabled = true;
                    btn.classList.add('opacity-60', 'cursor-not-allowed');
                }

                const token = localStorage.getItem('token') || localStorage.getItem('areaAdminToken') || localStorage.getItem('superAdminToken');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = 'Bearer ' + token;

                let response = await fetch(`${API_URL}/api/rents/reminders/start-unpaid`, {
                    method: 'POST',
                    headers
                });
                let data = await response.json().catch(() => ({}));

                // Fallback for older backend instances where start-unpaid route is not yet loaded
                if (response.status === 404) {
                    response = await fetch(`${API_URL}/api/rents/reminders/send`, {
                        method: 'POST',
                        headers
                    });
                    data = await response.json().catch(() => ({}));
                }

                if (!response.ok || (data.success === false)) {
                    throw new Error(data.message || data.error || 'Failed to send reminders');
                }

                showNotification(data.message || `Reminders sent to ${data.sent || 0} tenant(s)`, 'success');
                await loadData();
            } catch (err) {
                console.error('Error sending reminders:', err);
                showNotification(err.message || 'Failed to send reminders', 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.classList.remove('opacity-60', 'cursor-not-allowed');
                }
            }
        }

        function filterTable() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const rows = document.querySelectorAll('#tableBody tr');
            
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        }

        function showNotification(message, type = 'success') {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
            notification.innerHTML = `
                <div class="flex items-center gap-2">
                    <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-5 h-5"></i>
                    <span class="font-medium">${message}</span>
                </div>
            `;
            
            if (type === 'success') {
                notification.classList.add('bg-green-500', 'text-white');
            } else {
                notification.classList.add('bg-red-500', 'text-white');
            }
            
            document.body.appendChild(notification);
            lucide.createIcons();
            
            // Animate in
            setTimeout(() => {
                notification.classList.remove('translate-x-full');
            }, 10);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        function navigateTo(page) {
            console.log('Navigate to:', page);
        }

        function logout() {
            localStorage.removeItem('areaAdminToken');
            localStorage.removeItem('superAdminToken');
            window.location.href = '/superadmin/index';
        }

        // Initialize lucide icons
        lucide.createIcons();

