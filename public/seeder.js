/**
 * RoomHy Seeder - Initialize Development Data
 * Only for development/testing purposes
 * Only initializes if data doesn't already exist
 */

function initializeSeeder() {
    console.log("🌱 Checking RoomHy Development Database...");

    // Check if data already exists - if yes, skip seeding
    const existingData = localStorage.getItem('roomhy_superadmin_db');
    if (existingData) {
        console.log("✅ Database already initialized. Skipping seeder.");
        return;
    }

    console.log("🌱 Initializing RoomHy Development Database...");

    // ============================================
    // 1. SUPER ADMIN (Pre-configured)
    // ============================================
    const superAdminDb = {
        id: 'SUPER_ADMIN',
        email: 'admin@roomhy.local',
        password: '', // Managed via secure server authentication
        name: 'Super Admin',
        phone: '',
        org: '',
        role: 'superadmin',
        createdAt: new Date().toISOString()
    };
    localStorage.setItem('roomhy_superadmin_db', JSON.stringify(superAdminDb));
    console.log("✅ Super Admin created:", superAdminDb.email);

    // ============================================
    // 2. AREA MANAGERS DATABASE (Empty - created by Super Admin)
    // ============================================
    const areaManagersDb = [];
    localStorage.setItem('roomhy_areamanagers_db', JSON.stringify(areaManagersDb));
    console.log("✅ Area Managers DB initialized (empty)");

    // ============================================
    // 2B. EMPLOYEES DATABASE (Empty - created by Super Admin)
    // ============================================
    const employeesDb = [];
    localStorage.setItem('roomhy_employees', JSON.stringify(employeesDb));
    console.log("✅ Employees DB initialized (empty)");

    // ============================================
    // 3. PROPERTY OWNERS DATABASE (Created via Enquiry Approval)
    // ============================================
    const ownersDb = {};
    localStorage.setItem('roomhy_owners_db', JSON.stringify(ownersDb));
    console.log("✅ Property Owners DB initialized (empty - will be populated via enquiry approvals)");

    // ============================================
    // 4. TENANTS DATABASE (Created by Property Owners)
    // ============================================
    const tenantsDb = [];
    localStorage.setItem('roomhy_tenants', JSON.stringify(tenantsDb));
    console.log("✅ Tenants DB initialized (empty - will be populated by property owners)");

    // ============================================
    // 5. PROPERTIES DATABASE (Empty)
    // ============================================
    const propertiesDb = [];
    localStorage.setItem('roomhy_properties', JSON.stringify(propertiesDb));
    console.log("✅ Properties DB initialized (empty)");

    // ============================================
    // 6. ROOMS DATABASE (Empty)
    // ============================================
    const roomsDb = [];
    localStorage.setItem('roomhy_rooms', JSON.stringify(roomsDb));
    console.log("✅ Rooms DB initialized (empty)");

    // ============================================
    // 7. VISITS DATABASE (For enquiries)
    // ============================================
    const visitsDb = [];
    localStorage.setItem('roomhy_visits', JSON.stringify(visitsDb));
    console.log("✅ Visits DB initialized (empty)");

    // ============================================
    // 8. GENERAL LEADS DATABASE
    // ============================================
    const leadsDb = [];
    localStorage.setItem('roomhy_general_leads', JSON.stringify(leadsDb));
    console.log("✅ General Leads DB initialized (empty)");

    console.log("✨ Seeder completed successfully!");
    console.log("\n📝 DEFAULT CREDENTIALS (Development Only):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Super Admin Email: admin@roomhy.local");
    console.log("Authentication is handled by backend JWT API");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nArea Managers: To be created by Super Admin");
    console.log("Property Owners: To be created by Super Admin");
    console.log("Tenants: To be created by Property Owner");
}

// Auto-initialize on page load (check if already initialized to skip redundant work)
document.addEventListener('DOMContentLoaded', function() {
    // Only run seeder if data doesn't exist yet (avoids redundant checks)
    if (!localStorage.getItem('roomhy_superadmin_db')) {
        initializeSeeder();
    }
});

// Also allow manual initialization
if (typeof window !== 'undefined') {
    window.initializeSeeder = initializeSeeder;
}
