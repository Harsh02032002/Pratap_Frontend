lucide.createIcons();
        
        // Auth check: allow all staff roles (superadmin, area manager, employee)
        const user = getStaffSessionUser();
        if (!user || !isAllowedStaffRole(user.role)) {
            window.location.href = '/superadmin/index';
        } else {
            // Fill profile dynamically from logged-in staff account
            const name = user.name || user.loginId || 'Staff User';
            const email = user.email || '-';
            const phone = user.phone || '-';
            const roleText = user.role === 'superadmin'
                ? 'Super Administrator'
                : user.role === 'areamanager'
                    ? 'Area Manager'
                    : 'Employee';

            const nameEl = document.querySelector('h1.text-2xl');
            const subRoleEl = document.querySelector('p.text-gray-500');
            const avatarEl = document.querySelector('.w-32.h-32.rounded-xl');
            if (nameEl) nameEl.textContent = name;
            if (subRoleEl) subRoleEl.textContent = roleText;
            if (avatarEl) {
                const initials = String(name)
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(s => s[0].toUpperCase())
                    .join('') || 'ST';
                avatarEl.textContent = initials;
            }

            const infoValues = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2 p.text-gray-800.font-medium');
            if (infoValues.length >= 4) {
                infoValues[0].textContent = name;
                infoValues[1].textContent = email;
                infoValues[2].textContent = phone;
                infoValues[3].textContent = roleText;
            }
        }

        // Logout handler
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('manager_user');
            sessionStorage.removeItem('user');
            localStorage.removeItem('user');
            localStorage.removeItem('staff_user');
            localStorage.removeItem('staff_token');
            localStorage.removeItem('token');
            window.location.href = '/superadmin/index';
        });

        // Mobile menu functionality
        function toggleMobileMenu() {
            const mobileSidebar = document.querySelector('aside');
            const mobileOverlay = document.getElementById('mobile-sidebar-overlay');
            
            if (mobileSidebar.classList.contains('hidden')) {
                mobileSidebar.classList.remove('hidden');
                mobileSidebar.classList.add('fixed', 'inset-y-0', 'left-0');
                mobileOverlay.classList.remove('hidden');
            } else {
                mobileSidebar.classList.add('hidden');
                mobileSidebar.classList.remove('fixed', 'inset-y-0', 'left-0');
                mobileOverlay.classList.add('hidden');
            }
        }

        document.getElementById('mobile-menu-open').addEventListener('click', toggleMobileMenu);

