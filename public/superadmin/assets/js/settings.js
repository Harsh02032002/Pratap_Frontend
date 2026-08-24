lucide.createIcons();
        
        // Auth check
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user || user.role !== 'superadmin') {
            window.location.href = '/superadmin/index';
        }

        // Logout handler
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
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

