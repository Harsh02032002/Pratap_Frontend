/**
 * permissionKeys.js — Frontend
 * ─────────────────────────────────────────────────────────────────────────────
 * Mirror of Roomhy-Backend/utils/permissionKeys.js
 * Single source of truth for all employee permission strings in the frontend.
 * Import from here — never hardcode permission strings in components.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Top-Level Module Access Keys ────────────────────────────────────────────
export const MODULE_KEYS = {
  DASHBOARD:           'dashboard',
  HOME:                'home',
  USER_MANAGEMENT:     'user_management',
  PROPERTY_MANAGEMENT: 'property_management',
  CHAT_MANAGEMENT:     'chat_management',
  VISITS:              'visits',
  REPORT_ANALYTICS:    'report_analytics',
  BOOKING_LEADS:       'booking_leads',
  REVIEW:              'review',
  SUPPORT:             'support',
};

// ─── Modules available in Add Employee form ───────────────────────────────────
// Accounting, CRM, Subscription Control, Settings are NEVER shown
export const EMPLOYEE_MODULE_OPTIONS = [
  { id: MODULE_KEYS.DASHBOARD,           label: 'Dashboard' },
  { id: MODULE_KEYS.HOME,                label: 'Home' },
  { id: MODULE_KEYS.USER_MANAGEMENT,     label: 'User Management' },
  { id: MODULE_KEYS.PROPERTY_MANAGEMENT, label: 'Property Management' },
  { id: MODULE_KEYS.CHAT_MANAGEMENT,     label: 'Chat Management' },
  { id: MODULE_KEYS.VISITS,              label: 'Visit Reports' },
  { id: MODULE_KEYS.REPORT_ANALYTICS,    label: 'Reports & Analytics' },
  { id: MODULE_KEYS.BOOKING_LEADS,       label: 'Bookings & Leads' },
  { id: MODULE_KEYS.REVIEW,              label: 'Reviews' },
  { id: MODULE_KEYS.SUPPORT,             label: 'Support' },
];

// ─── Restricted Sub-Module Keys ───────────────────────────────────────────────
export const RESTRICTED_KEYS = {
  // Dashboard
  DASHBOARD_REVENUE:      'dashboard_revenue',
  DASHBOARD_ANALYTICS:    'dashboard_analytics',

  // Home
  HOME_REVENUE:           'home_revenue',
  HOME_PENDING_RENT:      'home_pending_rent',

  // User Management
  UM_TEAM_MANAGEMENT:     'um_team_management',
  UM_ROLES_PERMISSIONS:   'um_roles_permissions',
  UM_ATTENDANCE:          'um_attendance',
  UM_PROPERTY_OWNERS:     'um_property_owners',
  UM_OWNER_SUBSCRIPTIONS: 'um_owner_subscriptions',
  UM_TENANTS:             'um_tenants',
  UM_ADD_TENANT:          'um_add_tenant',
  UM_KYC:                 'um_kyc',
  UM_RENT_HISTORY:        'um_rent_history',
  UM_EMPLOYEE_MANAGEMENT: 'um_employee_management',
  UM_CREATE_USER:         'um_create_user',
  UM_EDIT_USER:           'um_edit_user',
  UM_DELETE_USER:         'um_delete_user',

  // Property Management
  PM_OVERVIEW:            'pm_overview',
  PM_TOTAL_PROPERTIES:    'pm_total_properties',
  PM_ADD_PROPERTY:        'pm_add_property',
  PM_APPROVE:             'pm_approve',
  PM_REJECT:              'pm_reject',
  PM_EMP_APPROVAL:        'pm_emp_approval',
  PM_PENDING:             'pm_pending',
  PM_ROOMS:               'pm_rooms',
  PM_LEADS:               'pm_leads',
  PM_CATEGORIES:          'pm_categories',
  PM_DELETE:              'pm_delete',
  PM_PERMANENT:           'pm_permanent',

  // Accounting
  ACC_OVERVIEW:           'acc_overview',
  ACC_REVENUE_OVERVIEW:   'acc_revenue_overview',
  ACC_PAYMENT_HISTORY:    'acc_payment_history',
  ACC_OTHER_CHARGES:      'acc_other_charges',
  ACC_PAYMENT_TRACKING:   'acc_payment_tracking',
  ACC_OWNER_PAYOUTS:      'acc_owner_payouts',
  ACC_PENDING_PAYOUTS:    'acc_pending_payouts',
  ACC_CASH_RECEIVED:      'acc_cash_received',
  ACC_FAILED_PAYOUTS:     'acc_failed_payouts',
  ACC_REFUNDS:            'acc_refunds',
  ACC_RENT_DUE_ALERTS:    'acc_rent_due_alerts',
  ACC_ROOMHY_REVENUE:     'acc_roomhy_revenue',
  ACC_OWNER_REVENUE:      'acc_owner_revenue',
  ACC_PROFIT_LOSS:        'acc_profit_loss',
  ACC_CASHFLOW:           'acc_cashflow',

  // Chat Management
  CHAT_LIVE:              'chat_live',
  CHAT_ALERTS:            'chat_alerts',
  CHAT_VIOLATIONS:        'chat_violations',

  // Visit Reports
  VISIT_SUBMIT:           'visit_submit',
  VISIT_VIEW:             'visit_view',

  // Reports
  RPT_OVERVIEW:           'rpt_overview',
  RPT_PERFORMANCE:        'rpt_performance',
  RPT_LOCATIONS:          'rpt_locations',
  RPT_OCCUPANCY:          'rpt_occupancy',
  RPT_REVENUE:            'rpt_revenue',
  RPT_GROWTH:             'rpt_growth',
  RPT_STAFF:              'rpt_staff',
  RPT_COMPANY:            'rpt_company',

  // Bookings
  BK_OVERVIEW:            'bk_overview',
  BK_LEADS:               'bk_leads',
  BK_DIRECT:              'bk_direct',
  BK_CONVERSION:          'bk_conversion',
  BK_LOCATIONS:           'bk_locations',
  BK_REVENUE:             'bk_revenue',

  // Reviews
  RV_OVERVIEW:            'rv_overview',
  RV_ALL:                 'rv_all',
  RV_MODERATION:          'rv_moderation',
  RV_ANALYTICS:           'rv_analytics',
  RV_FEED:                'rv_feed',

  // Support
  SP_OVERVIEW:            'sp_overview',
  SP_TENANT_COMPLAINTS:   'sp_tenant_complaints',
  SP_OWNER_COMPLAINTS:    'sp_owner_complaints',
  SP_WEBSITE_QUERIES:     'sp_website_queries',
  SP_VERIFICATION:        'sp_verification',
  SP_RESOLUTION:          'sp_resolution',
};

// ─── Restricted Module Groups (for UI rendering) ──────────────────────────────
export const RESTRICTED_MODULE_GROUPS = [
  {
    moduleLabel: 'Dashboard',
    items: [
      { key: RESTRICTED_KEYS.DASHBOARD_REVENUE,   label: 'Revenue Cards' },
      { key: RESTRICTED_KEYS.DASHBOARD_ANALYTICS, label: 'Company Analytics' },
    ],
  },
  {
    moduleLabel: 'Home',
    items: [
      { key: RESTRICTED_KEYS.HOME_REVENUE,      label: 'Revenue Overview' },
      { key: RESTRICTED_KEYS.HOME_PENDING_RENT, label: 'Alerts (Pending Rent)' },
    ],
  },
  {
    moduleLabel: 'User Management',
    items: [
      { key: RESTRICTED_KEYS.UM_TEAM_MANAGEMENT,     label: 'Team Management' },
      { key: RESTRICTED_KEYS.UM_ROLES_PERMISSIONS,   label: 'Roles & Permissions' },
      { key: RESTRICTED_KEYS.UM_ATTENDANCE,          label: 'Attendance' },
      { key: RESTRICTED_KEYS.UM_PROPERTY_OWNERS,     label: 'Property Owners' },
      { key: RESTRICTED_KEYS.UM_OWNER_SUBSCRIPTIONS, label: 'Owner Subscriptions' },
      { key: RESTRICTED_KEYS.UM_TENANTS,             label: 'Tenants' },
      { key: RESTRICTED_KEYS.UM_ADD_TENANT,          label: 'Add Tenant' },
      { key: RESTRICTED_KEYS.UM_KYC,                 label: 'KYC / Documents' },
      { key: RESTRICTED_KEYS.UM_RENT_HISTORY,        label: 'Rent History' },
      { key: RESTRICTED_KEYS.UM_CREATE_USER,         label: 'Create User' },
      { key: RESTRICTED_KEYS.UM_EDIT_USER,           label: 'Edit User' },
      { key: RESTRICTED_KEYS.UM_DELETE_USER,         label: 'Delete User' },
    ],
  },
  {
    moduleLabel: 'Property Management',
    items: [
      { key: RESTRICTED_KEYS.PM_OVERVIEW,         label: 'Property Overview' },
      { key: RESTRICTED_KEYS.PM_TOTAL_PROPERTIES, label: 'Total Properties' },
      { key: RESTRICTED_KEYS.PM_ADD_PROPERTY,     label: 'Add Property' },
      { key: RESTRICTED_KEYS.PM_APPROVE,          label: 'Approve Property' },
      { key: RESTRICTED_KEYS.PM_REJECT,           label: 'Reject Property' },
      { key: RESTRICTED_KEYS.PM_EMP_APPROVAL,     label: 'Employee Property Approval' },
      { key: RESTRICTED_KEYS.PM_PENDING,          label: 'Pending Properties' },
      { key: RESTRICTED_KEYS.PM_ROOMS,            label: 'Rooms Management' },
      { key: RESTRICTED_KEYS.PM_LEADS,            label: 'Online Leads' },
      { key: RESTRICTED_KEYS.PM_CATEGORIES,       label: 'Property Categories' },
      { key: RESTRICTED_KEYS.PM_DELETE,           label: 'Delete Property' },
    ],
  },
  {
    moduleLabel: 'Accounting',
    items: [
      { key: RESTRICTED_KEYS.ACC_OVERVIEW,         label: 'Accounting Overview' },
      { key: RESTRICTED_KEYS.ACC_REVENUE_OVERVIEW, label: 'Revenue Overview' },
      { key: RESTRICTED_KEYS.ACC_PAYMENT_HISTORY,  label: 'Payment History' },
      { key: RESTRICTED_KEYS.ACC_OWNER_PAYOUTS,    label: 'Owner Payouts' },
      { key: RESTRICTED_KEYS.ACC_REFUNDS,          label: 'Refunds' },
      { key: RESTRICTED_KEYS.ACC_ROOMHY_REVENUE,   label: 'Roomhy Monthly Revenue' },
      { key: RESTRICTED_KEYS.ACC_OWNER_REVENUE,    label: 'Owners Monthly Revenue' },
      { key: RESTRICTED_KEYS.ACC_PROFIT_LOSS,      label: 'Profit / Loss Report' },
      { key: RESTRICTED_KEYS.ACC_CASHFLOW,         label: 'Cashflow Dashboard' },
    ],
  },
  {
    moduleLabel: 'Chat Management',
    items: [
      { key: RESTRICTED_KEYS.CHAT_LIVE,       label: 'Live Conversations' },
      { key: RESTRICTED_KEYS.CHAT_ALERTS,     label: 'Alerts' },
      { key: RESTRICTED_KEYS.CHAT_VIOLATIONS, label: 'Violations' },
    ],
  },
  {
    moduleLabel: 'Visit Reports',
    items: [
      { key: RESTRICTED_KEYS.VISIT_SUBMIT, label: 'Submit Visit Report' },
      { key: RESTRICTED_KEYS.VISIT_VIEW,   label: 'View Visit Reports' },
    ],
  },
  {
    moduleLabel: 'Reports',
    items: [
      { key: RESTRICTED_KEYS.RPT_OVERVIEW,    label: 'Reports Overview' },
      { key: RESTRICTED_KEYS.RPT_PERFORMANCE, label: 'Property Performance' },
      { key: RESTRICTED_KEYS.RPT_LOCATIONS,   label: 'Location Wise Data' },
      { key: RESTRICTED_KEYS.RPT_OCCUPANCY,   label: 'Occupancy Rate Report' },
      { key: RESTRICTED_KEYS.RPT_REVENUE,     label: 'Revenue Report' },
      { key: RESTRICTED_KEYS.RPT_GROWTH,      label: 'Growth Analytics' },
      { key: RESTRICTED_KEYS.RPT_STAFF,       label: 'Staff Performance' },
    ],
  },
  {
    moduleLabel: 'Bookings',
    items: [
      { key: RESTRICTED_KEYS.BK_OVERVIEW,   label: 'Bookings Overview' },
      { key: RESTRICTED_KEYS.BK_LEADS,      label: 'Total Leads' },
      { key: RESTRICTED_KEYS.BK_DIRECT,     label: 'Direct Bookings' },
      { key: RESTRICTED_KEYS.BK_CONVERSION, label: 'Conversion Rate' },
      { key: RESTRICTED_KEYS.BK_LOCATIONS,  label: 'Top Performing Locations' },
    ],
  },
  {
    moduleLabel: 'Reviews',
    items: [
      { key: RESTRICTED_KEYS.RV_OVERVIEW,   label: 'Reviews Overview' },
      { key: RESTRICTED_KEYS.RV_ALL,        label: 'All Reviews' },
      { key: RESTRICTED_KEYS.RV_MODERATION, label: 'Review Moderation' },
      { key: RESTRICTED_KEYS.RV_ANALYTICS,  label: 'Review Analytics' },
      { key: RESTRICTED_KEYS.RV_FEED,       label: 'New Review Feed' },
    ],
  },
  {
    moduleLabel: 'Support',
    items: [
      { key: RESTRICTED_KEYS.SP_OVERVIEW,          label: 'Support Overview' },
      { key: RESTRICTED_KEYS.SP_TENANT_COMPLAINTS, label: 'Tenants Complaints' },
      { key: RESTRICTED_KEYS.SP_OWNER_COMPLAINTS,  label: 'Owners Complaints' },
      { key: RESTRICTED_KEYS.SP_WEBSITE_QUERIES,   label: 'Website Queries' },
      { key: RESTRICTED_KEYS.SP_VERIFICATION,      label: 'Verification System' },
      { key: RESTRICTED_KEYS.SP_RESOLUTION,        label: 'Issue Resolution Tracking' },
    ],
  },
];

// ─── Default: all restricted sub-modules are BLOCKED for new employees ────────
export const DEFAULT_RESTRICTED_MODULES = Object.values(RESTRICTED_KEYS);

// ─── Employee types ───────────────────────────────────────────────────────────
export const EMPLOYEE_TYPES = [
  'Field Executive',
  'Area Manager',
  'Marketing Executive',
  'Verification Officer',
];

// ─── Roles requiring assignedProperties to be non-empty ──────────────────────
export const ROLES_REQUIRING_ASSIGNED_PROPERTIES = [
  'Field Executive',
  'Verification Officer',
];
