/**
 * Test configuration and constants.
 *
 * Before running tests, ensure a test user exists in the database:
 *   - Email: test@costumetrack.com
 *   - Password: TestPassword123!
 *   - Organization: Test Costume Shop
 *   - Has at least the default categories
 *
 * You can create this via the register flow or directly in the DB.
 */
export const TEST_USER = {
  email: "test@costumetrack.com",
  password: "TestPassword123!",
  name: "Test User",
  organizationName: "Test Costume Shop",
};

export const TEST_INVITE_CODE = "COSTUME2025";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  inventory: "/inventory",
  inventoryNew: "/inventory/new",
  rentals: "/rentals",
  rentalsNew: "/rentals/new",
  customers: "/customers",
  customersNew: "/customers/new",
  productions: "/productions",
  productionsNew: "/productions/new",
  settings: "/settings",
  adminInviteCodes: "/admin/invite-codes",
} as const;
