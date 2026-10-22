lucide.createIcons();

        const WINDOW_NAME_SESSION_PREFIX = '__ROOMHY_STAFF_SESSION__:';

        function resolvePanelPath(folder, fileName) {
            return `/${folder}/${fileName}`;
        }

        function persistWindowSession(user) {
            try {
                window.name = `${WINDOW_NAME_SESSION_PREFIX}${encodeURIComponent(JSON.stringify(user || {}))}`;
            } catch (e) {
                console.warn('[Login] Failed to persist window.name session:', e);
            }
        }

        function buildStaffRedirect(user) {
            const base = resolvePanelPath('employee', 'areaadmin');
            try {
                return `${base}?staff=${encodeURIComponent(JSON.stringify(user || {}))}`;
            } catch (e) {
                return base;
            }
        }
        
        // Unified Login Handler - Auto-detects user role by ID (optimized for speed)
        function handleUnifiedLogin() {
            const loginId = document.getElementById('login-id').value.trim();
            const password = document.getElementById('login-password').value.trim();
            const errorMsg = document.getElementById('error-msg');
            errorMsg.classList.add('hidden');

            console.log('[Login] Starting login process for ID:', loginId);

            if (!loginId || !password) {
                showError('Please fill in all fields.', errorMsg);
                return;
            }

            // Clear previous sessions - only clear STAFF sessions, not owner sessions
            sessionStorage.removeItem('manager_user');
            sessionStorage.removeItem('user');
            // Don't remove owner_session - let owner login page manage that
            
            // Also clear owner-related localStorage to prevent crosstalk
            localStorage.removeItem('owner_user'); // Will be set by owner login if needed

            const up = loginId.toUpperCase();

            // Priority 1: Check databases first (supports old and new IDs)
            // This ensures old IDs are found before format-based routing
            
            // Check Area Managers DB
            try {
                const mgrs = JSON.parse(localStorage.getItem('roomhy_areamanagers_db') || '[]');
                if (Array.isArray(mgrs) && mgrs.find(m => (m.loginId || '').toUpperCase() === up)) {
                    console.log('[Login] Found in Area Managers DB');
                    loginAreaManager(loginId, password, errorMsg);
                    return;
                }
            } catch (e) {
                console.warn('Could not parse roomhy_areamanagers_db', e);
            }

            // Check Employees DB
            try {
                const emps = JSON.parse(localStorage.getItem('roomhy_employees') || '[]');
                if (Array.isArray(emps) && emps.find(e => (e.loginId || '').toUpperCase() === up)) {
                    console.log('[Login] Found in Employees DB');
                    loginEmployee(loginId, password, errorMsg);
                    return;
                }
            } catch (e) {
                console.warn('Could not parse roomhy_employees', e);
            }

            // Check Owners DB (object keyed by ownerId)
            try {
                const owners = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');
                if (owners && (owners[loginId] || owners[up])) {
                    console.log('[Login] Found in Owners DB');
                    loginOwner(loginId, password, errorMsg);
                    return;
                }
            } catch (e) {
                console.warn('Could not parse roomhy_owners_db', e);
            }

            // Check Tenants DB
            try {
                const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
                if (Array.isArray(tenants) && tenants.find(t => (t.loginId || '').toUpperCase() === up)) {
                    console.log('[Login] Found in Tenants DB');
                    loginTenant(loginId, password, errorMsg);
                    return;
                }
            } catch (e) {
                console.warn('Could not parse roomhy_tenants', e);
            }

            // Priority 2: Format-based detection for new IDs or non-database matches
            console.log('[Login] Using format-based detection for ID:', loginId);
            if (loginId.includes('@')) {
                // Email format - try SuperAdmin
                console.log('[Login] Detected SuperAdmin (email format)');
                loginSuperAdmin(loginId, password, errorMsg);
                return;
            } else if (up.startsWith('ROOMHY')) {
                // Owner ID format
                console.log('[Login] Detected Owner (ROOMHY prefix)');
                loginOwner(loginId, password, errorMsg);
                return;
            } else if (up.startsWith('MGR')) {
                // Area Manager format
                console.log('[Login] Detected Area Manager (MGR prefix)');
                loginAreaManager(loginId, password, errorMsg);
                return;
            } else if (up.startsWith('RY') || up.startsWith('EMP')) {
                // Employee format (RY prefix or generic EMP)
                console.log('[Login] Detected Employee (RY/EMP prefix)');
                loginEmployee(loginId, password, errorMsg);
                return;
            } else if (up.startsWith('ROOMHYTNT') || up.startsWith('TNT')) {
                // Tenant ID format
                console.log('[Login] Detected Tenant (ROOMHYTNT/TNT prefix)');
                loginTenant(loginId, password, errorMsg);
                return;
            }

            // If no match found anywhere
            console.error('[Login] Could not detect user type for ID:', loginId);
            showError('Login ID format not recognized.', errorMsg);
        }

        // SuperAdmin Login - backend only
        // NOTE: This is STAFF login section - uses staff_user/staff_token keys
        async function loginSuperAdmin(email, password, errorMsg) {
            console.log('[Staff Login] Attempting SuperAdmin login with email:', email);
            
            // Auth is backend-only: no hardcoded credentials, no localStorage
            // credential store, no client-side issued tokens.

            // Authenticate against the backend (5 second timeout)
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                
                const response = await fetch(API_URL + '/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: email, password }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data.token && data.user) {
                        console.log('[Staff Login] ✅ SuperAdmin login via backend API');
                        // Store user and token from backend
                        localStorage.setItem('staff_user', JSON.stringify(data.user));
                        localStorage.setItem('staff_token', data.token);
                        persistWindowSession(data.user);
                        sessionStorage.setItem('user', JSON.stringify(data.user));
                        localStorage.setItem('user', JSON.stringify(data.user));
                        localStorage.setItem('token', data.token);
                        // Clear owner sessions to prevent crosstalk
                        sessionStorage.removeItem('owner_session');
                        localStorage.removeItem('owner_user');
                        window.location.href = resolvePanelPath('superadmin', 'superadmin');
                        return;
                    }
                }
            } catch (err) {
                console.warn('[Staff Login] Backend API unavailable or slow:', err.message);
                // Continue to show invalid credentials error
            }

            // If both local and backend failed
            console.warn('[Staff Login] SuperAdmin login failed - Invalid credentials');
            showError('Invalid credentials.', errorMsg);
        }

        // Owner Login
        // NOTE: This is for OWNER dashboard - uses owner_session key
        function loginOwner(ownerId, password, errorMsg) {
            console.log('[Owner Login] Searching for Owner with ID:', ownerId);
            
            const db = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');
            // Try direct lookup first, then case-insensitive search
            let owner = db[ownerId];
            if (!owner) {
                // Case-insensitive search
                const ownerKey = Object.keys(db).find(key => key.toUpperCase() === ownerId.toUpperCase());
                owner = ownerKey ? db[ownerKey] : null;
            }

            if (!owner) {
                console.warn('[Owner Login] Owner not found with ID:', ownerId);
                return showError('ID not found.', errorMsg);
            }

            const storedPass = owner.credentials?.password || owner.password;
            
            if (storedPass === password) {
                // Check if first time setup is needed
                if (owner.credentials?.firstTime || !owner.passwordSet) {
                    console.warn('[Owner Login] Owner found but first-time password setup required:', ownerId);
                    showError('Please use the separate portal to set your password.', errorMsg);
                    return;
                }

                console.log('[Owner Login] ✅ Owner login successful:', ownerId);
                // Clear STAFF sessions to prevent crosstalk
                sessionStorage.removeItem('manager_user');
                sessionStorage.removeItem('user');
                localStorage.removeItem('staff_user');
                localStorage.removeItem('staff_token');
                
                // Successful login - set owner session
                const sessionUser = { 
                    loginId: ownerId, 
                    role: 'owner', 
                    ownerId: ownerId, 
                    name: owner.profile?.name || 'Owner' 
                };
                sessionStorage.setItem('owner_session', JSON.stringify(sessionUser));
                localStorage.setItem('owner_user', JSON.stringify(sessionUser));
                window.location.href = resolvePanelPath('propertyowner', 'admin');
            } else {
                console.warn('[Owner Login] Owner credentials invalid for:', ownerId);
                showError('Invalid credentials.', errorMsg);
            }
        }

        // Area Manager Login
        // NOTE: This is STAFF login section - uses staff_user/staff_token keys
        function loginAreaManager(loginId, password, errorMsg) {
            const db = JSON.parse(localStorage.getItem('roomhy_areamanagers_db') || '[]');
            console.log('[Staff Login] Searching for Area Manager with ID:', loginId);
            console.log('[Staff Login] Total area managers in storage:', db.length);
            
            const mgr = db.find(m => (m.loginId || '').toUpperCase() === loginId.toUpperCase() && m.password === password);
            if (mgr) {
                console.log('[Staff Login] ✅ Area Manager login successful:', loginId);
                const user = { ...mgr, role: 'areamanager' };
                user.areaCode = user.areaCode || user.area || user.areaName || '';
                user.areaName = user.areaName || user.area || '';
                // Set staff session with isolated keys
                sessionStorage.setItem('manager_user', JSON.stringify(user));
                sessionStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('staff_user', JSON.stringify(user));
                localStorage.setItem('staff_token', 'manager_token');
                persistWindowSession(user);
                // Clear owner sessions to prevent crosstalk
                sessionStorage.removeItem('owner_session');
                localStorage.removeItem('owner_user');
                window.location.href = buildStaffRedirect(user);
            } else {
                console.warn('[Staff Login] Area Manager not found or password mismatch for:', loginId);
                showError('Invalid credentials.', errorMsg);
            }
        }

        // Employee Login with detailed logging
        // NOTE: This is STAFF login section - uses staff_user/staff_token keys
        function loginEmployee(loginId, password, errorMsg) {
             const employees = JSON.parse(localStorage.getItem('roomhy_employees') || '[]');
             console.log('[Staff Login] Searching for employee with ID:', loginId);
             console.log('[Staff Login] Total employees in storage:', employees.length);
             
             const emp = employees.find(e => {
                 const storedId = (e.loginId || '').toUpperCase();
                 const inputId = loginId.toUpperCase();
                 const passwordMatch = e.password === password;
                 
                 if (storedId === inputId) {
                     console.log('[Staff Login] Found matching loginId:', storedId);
                     console.log('[Staff Login] Password in storage:', e.password ? '***' + e.password.slice(-3) : 'EMPTY');
                     console.log('[Staff Login] Password entered:', password ? '***' + password.slice(-3) : 'EMPTY');
                     console.log('[Staff Login] Password match:', passwordMatch);
                 }
                 return storedId === inputId && passwordMatch;
             });

             if (!emp) {
                 console.warn('[Staff Login] Employee not found or password mismatch for:', loginId);
                 showError('Invalid credentials.', errorMsg);
                 return;
             }

             console.log('[Staff Login] ✅ Employee login successful:', loginId);

             const user = {
                 loginId: emp.loginId,
                 name: emp.name,
                 role: 'employee',
                 team: emp.team || emp.role || 'Employee',
                 permissions: emp.permissions || [],
                 location: emp.location || emp.area || emp.areaName || '',
                 area: emp.area || emp.areaName || '',
                 areaName: emp.areaName || emp.area || '',
                 areaCode: emp.areaCode || ''
             };

             // Set staff session with isolated keys
             sessionStorage.setItem('manager_user', JSON.stringify(user));
             sessionStorage.setItem('user', JSON.stringify(user));
             localStorage.setItem('user', JSON.stringify(user));
             localStorage.setItem('staff_user', JSON.stringify(user));
             localStorage.setItem('staff_token', 'employee_token');
             persistWindowSession(user);
             // Clear owner sessions to prevent crosstalk
             sessionStorage.removeItem('owner_session');
             localStorage.removeItem('owner_user');
             window.location.href = buildStaffRedirect(user);
        }

        // Tenant Login
        function loginTenant(loginId, password, errorMsg) {
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const tenantIdx = tenants.findIndex(t => (t.loginId || '').toUpperCase() === String(loginId || '').toUpperCase());

            if (tenantIdx === -1) {
                showError('Tenant ID not found.', errorMsg);
                return;
            }

            const tenant = tenants[tenantIdx];

            // Existing tenant password login
            if (tenant.password && tenant.password === password) {
                createTenantSessionAndRedirect(tenant);
                return;
            }

            // First-time login with temporary password: force new password setup
            const isFirstTime = (tenant.tempPassword && tenant.tempPassword === password) &&
                (tenant.status === 'pending' || !tenant.passwordSet);

            if (isFirstTime) {
                const newPassword = prompt('Set your new password (minimum 6 characters):');
                if (newPassword === null) {
                    showError('Password setup cancelled.', errorMsg);
                    return;
                }
                if (String(newPassword).trim().length < 6) {
                    showError('New password must be at least 6 characters.', errorMsg);
                    return;
                }

                const confirmPassword = prompt('Confirm your new password:');
                if (confirmPassword === null) {
                    showError('Password setup cancelled.', errorMsg);
                    return;
                }
                if (newPassword !== confirmPassword) {
                    showError('Passwords do not match.', errorMsg);
                    return;
                }

                tenants[tenantIdx].password = newPassword;
                tenants[tenantIdx].tempPassword = null;
                tenants[tenantIdx].passwordSet = true;
                localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));

                createTenantSessionAndRedirect(tenants[tenantIdx]);
                return;
            }

            showError('Invalid credentials.', errorMsg);
        }

        function createTenantSessionAndRedirect(tenant) {
            // Clear staff and owner sessions to prevent crosstalk
            sessionStorage.removeItem('manager_user');
            sessionStorage.removeItem('user');
            localStorage.removeItem('staff_user');
            localStorage.removeItem('staff_token');
            sessionStorage.removeItem('owner_session');
            localStorage.removeItem('owner_user');

            const tenantUser = {
                name: tenant.name || 'Tenant',
                phone: tenant.phone || '',
                email: tenant.email || '',
                loginId: tenant.loginId,
                role: 'tenant',
                tenantId: tenant.id || tenant._id || tenant.loginId,
                passwordSet: true
            };

            localStorage.setItem('tenant_user', JSON.stringify(tenantUser));
            localStorage.setItem('user', JSON.stringify(tenantUser));
            window.location.href = resolvePanelPath('tenant', 'tenantdashboard');
        }

        function showError(msg, errorMsg) {
            errorMsg.textContent = msg;
            errorMsg.classList.remove('hidden');
        }

        // Forgot Password Functions
        let forgotPasswordState = {
            email: '',
            otp: '',
            token: '',
            source: '',
            localOtp: ''  // OTP for emails found only in localStorage
        };

        function showForgotPasswordModal() {
            document.getElementById('forgot-password-modal').classList.remove('hidden');
            resetForgotPasswordModal();
            lucide.createIcons();
        }

        function closeForgotPasswordModal() {
            document.getElementById('forgot-password-modal').classList.add('hidden');
            resetForgotPasswordModal();
        }

        function resetForgotPasswordModal() {
            document.getElementById('step-email').classList.remove('hidden');
            document.getElementById('step-otp').classList.add('hidden');
            document.getElementById('step-password').classList.add('hidden');
            document.getElementById('forgot-email').value = '';
            document.getElementById('forgot-otp').value = '';
            document.getElementById('forgot-new-password').value = '';
            document.getElementById('forgot-confirm-password').value = '';
            clearErrors();
            forgotPasswordState = { email: '', otp: '', token: '', source: '', localOtp: '' };
        }

        function clearErrors() {
            document.getElementById('forgot-email-error').classList.add('hidden');
            document.getElementById('forgot-otp-error').classList.add('hidden');
            document.getElementById('forgot-password-error').classList.add('hidden');
            document.getElementById('forgot-confirm-error').classList.add('hidden');
        }

        async function sendOTP() {
            clearErrors();
            const email = document.getElementById('forgot-email').value.trim();
            const emailError = document.getElementById('forgot-email-error');

            if (!email) {
                emailError.textContent = 'Please enter your email address';
                emailError.classList.remove('hidden');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                emailError.textContent = 'Please enter a valid email address';
                emailError.classList.remove('hidden');
                return;
            }

            console.log('[ForgotPassword] Checking for email:', email);

            // Step 1: Check local databases first (manager, employees, etc.)
            let staffFound = false;
            let staffType = '';

            // Helper function to safely access localStorage with Tracking Prevention handling
            function safeLocalStorageGet(key) {
                try {
                    return localStorage.getItem(key);
                } catch (e) {
                    console.warn('[ForgotPassword] Tracking Prevention: Could not access', key);
                    return null;
                }
            }

            // Check SuperAdmin
            try {
                const superAdminStr = safeLocalStorageGet('roomhy_superadmin_db');
                const superAdminDb = superAdminStr ? JSON.parse(superAdminStr) : null;
                if (superAdminDb && superAdminDb.email && superAdminDb.email.toLowerCase() === email.toLowerCase()) {
                    staffFound = true;
                    staffType = 'superadmin';
                    console.log('[ForgotPassword] Found in SuperAdmin DB');
                }
            } catch (e) {
                console.warn('[ForgotPassword] Could not check SuperAdmin DB', e);
            }

            // Check Area Managers (from manager)
            if (!staffFound) {
                try {
                    const managersStr = safeLocalStorageGet('roomhy_areamanagers_db');
                    const managers = managersStr ? JSON.parse(managersStr) : [];
                    if (Array.isArray(managers)) {
                        const found = managers.find(m => m.email && m.email.toLowerCase() === email.toLowerCase());
                        if (found) {
                            staffFound = true;
                            staffType = 'areamanager';
                            console.log('[ForgotPassword] Found in Area Managers DB');
                        }
                    }
                } catch (e) {
                    console.warn('[ForgotPassword] Could not check Area Managers DB', e);
                }
            }

            // Check Employees
            if (!staffFound) {
                try {
                    const employeesStr = safeLocalStorageGet('roomhy_employees');
                    const employees = employeesStr ? JSON.parse(employeesStr) : [];
                    if (Array.isArray(employees)) {
                        const found = employees.find(e => e.email && e.email.toLowerCase() === email.toLowerCase());
                        if (found) {
                            staffFound = true;
                            staffType = 'employee';
                            console.log('[ForgotPassword] Found in Employees DB');
                        }
                    }
                } catch (e) {
                    console.warn('[ForgotPassword] Could not check Employees DB', e);
                }
            }

            // Step 2: Always verify with backend (even if found locally for security)
            console.log('[ForgotPassword] Verifying email with backend...');
            try {
                const response = await fetch(API_URL + '/api/auth/forgot-password/request-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, source: staffFound ? staffType : 'api' })
                });

                const data = await response.json();

                if (!response.ok) {
                    // If found locally but not in backend, still allow to proceed
                    if (staffFound) {
                        console.log('[ForgotPassword] Found locally but not in backend, will handle locally');
                    } else {
                        emailError.textContent = data.message || 'Email not found. Please check and try again.';
                        emailError.classList.remove('hidden');
                        return;
                    }
                } else {
                    // Success from backend
                    staffFound = true;
                    staffType = 'verified';
                }
            } catch (err) {
                // Network error - if found locally, continue anyway
                if (!staffFound) {
                    console.error('Error checking backend:', err);
                    emailError.textContent = 'Failed to connect. Please try again.';
                    emailError.classList.remove('hidden');
                    return;
                } else {
                    console.warn('Backend connection failed, but email found locally - continuing');
                }
            }

            // Step 3: If found, proceed with OTP
            if (staffFound) {
                console.log('[ForgotPassword] Staff found as ' + staffType + ', proceeding with OTP');
                
                // Store email for next steps
                try {
                    sessionStorage.setItem('forgotPasswordEmail', email);
                } catch (e) {
                    console.warn('[ForgotPassword] Could not save to sessionStorage:', e);
                }
                
                forgotPasswordState.email = email;
                forgotPasswordState.source = staffType;
                
                // If email found ONLY locally (not in backend), generate local OTP
                if (['superadmin', 'areamanager', 'employee'].includes(staffType)) {
                    const localOtp = String(Math.floor(100000 + Math.random() * 900000));
                    forgotPasswordState.localOtp = localOtp;
                    console.log('[ForgotPassword] ⚠️  EMAIL FOUND LOCALLY ONLY');
                    console.log('[ForgotPassword] Generated Local OTP:', localOtp);
                    console.log('[ForgotPassword] Enter this OTP in the form to proceed');
                }
                
                document.getElementById('otp-email-display').textContent = email;
                document.getElementById('step-email').classList.add('hidden');
                document.getElementById('step-otp').classList.remove('hidden');
                
                console.log('[ForgotPassword] Proceeding to OTP step for:', email);
            } else {
                emailError.textContent = 'Email not found in any staff system. Please check and try again.';
                emailError.classList.remove('hidden');
            }
        }

        async function verifyOTP() {
            clearErrors();
            const otp = document.getElementById('forgot-otp').value.trim();
            const otpError = document.getElementById('forgot-otp-error');

            if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
                otpError.textContent = 'Please enter a valid 6-digit OTP';
                otpError.classList.remove('hidden');
                return;
            }

            // If email was found only locally, verify against locally generated OTP
            if (forgotPasswordState.localOtp) {
                console.log('[ForgotPassword] Verifying OTP locally...');
                if (otp === forgotPasswordState.localOtp) {
                    console.log('[ForgotPassword] ✅ OTP verified successfully!');
                    // Generate a fake token for local handling
                    forgotPasswordState.token = 'local_' + Date.now();
                    document.getElementById('step-otp').classList.add('hidden');
                    document.getElementById('step-password').classList.remove('hidden');
                    return;
                } else {
                    console.log('[ForgotPassword] ❌ OTP mismatch. Expected:', forgotPasswordState.localOtp, 'Got:', otp);
                    otpError.textContent = 'Invalid OTP. Please try again.';
                    otpError.classList.remove('hidden');
                    return;
                }
            }

            // Otherwise verify with backend API
            try {
                const response = await fetch(API_URL + '/api/auth/forgot-password/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: forgotPasswordState.email, otp })
                });

                const data = await response.json();

                if (!response.ok) {
                    otpError.textContent = data.message || 'Invalid OTP. Please try again.';
                    otpError.classList.remove('hidden');
                    return;
                }

                forgotPasswordState.token = data.token;
                document.getElementById('step-otp').classList.add('hidden');
                document.getElementById('step-password').classList.remove('hidden');
            } catch (err) {
                console.error('Error verifying OTP:', err);
                otpError.textContent = 'Failed to verify OTP. Please try again.';
                otpError.classList.remove('hidden');
            }
        }

        async function resetPassword() {
            clearErrors();
            const newPassword = document.getElementById('forgot-new-password').value;
            const confirmPassword = document.getElementById('forgot-confirm-password').value;
            const passwordError = document.getElementById('forgot-password-error');
            const confirmError = document.getElementById('forgot-confirm-error');

            if (!newPassword) {
                passwordError.textContent = 'Please enter a new password';
                passwordError.classList.remove('hidden');
                return;
            }

            // If password was reset locally, update localStorage
            if (forgotPasswordState.source === 'employee') {
                if (newPassword.length < 6) {
                    passwordError.textContent = 'Password must be at least 6 characters';
                    passwordError.classList.remove('hidden');
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    confirmError.textContent = 'Passwords do not match';
                    confirmError.classList.remove('hidden');
                    return;
                }

                // Update password in localStorage
                try {
                    const employeesStr = localStorage.getItem('roomhy_employees');
                    const employees = employeesStr ? JSON.parse(employeesStr) : [];
                    const employee = employees.find(e => e.email && e.email.toLowerCase() === forgotPasswordState.email.toLowerCase());
                    
                    if (employee) {
                        employee.password = newPassword;
                        localStorage.setItem('roomhy_employees', JSON.stringify(employees));
                        console.log('[ForgotPassword] ✅ Password updated in localStorage for:', forgotPasswordState.email);
                        
                        // Close modal and redirect
                        closeForgotPasswordModal();
                        alert('✅ Password reset successfully! Please login with your new password.', 'success');
                        return;
                    } else {
                        passwordError.textContent = 'Employee record not found';
                        passwordError.classList.remove('hidden');
                        return;
                    }
                } catch (err) {
                    console.error('[ForgotPassword] Error updating localStorage:', err);
                    passwordError.textContent = 'Failed to update password';
                    passwordError.classList.remove('hidden');
                    return;
                }
            }

            if (newPassword.length < 6) {
                passwordError.textContent = 'Password must be at least 6 characters';
                passwordError.classList.remove('hidden');
                return;
            }

            if (newPassword !== confirmPassword) {
                confirmError.textContent = 'Passwords do not match';
                confirmError.classList.remove('hidden');
                return;
            }

            try {
                const response = await fetch(API_URL + '/api/auth/forgot-password/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: forgotPasswordState.email, 
                        token: forgotPasswordState.token,
                        newPassword 
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    passwordError.textContent = data.message || 'Failed to reset password. Please try again.';
                    passwordError.classList.remove('hidden');
                    return;
                }

                // Password reset successful
                alert('Password reset successful! You can now login with your new password.');
                closeForgotPasswordModal();
                document.getElementById('login-id').focus();
            } catch (err) {
                console.error('Error resetting password:', err);
                passwordError.textContent = 'Failed to reset password. Please try again.';
                passwordError.classList.remove('hidden');
            }
        }

        function backToEmail() {
            resetForgotPasswordModal();
        }

