/**
 * @param {string | null | undefined} role
 */
function isAdminRole(role) {
  return role === "Admin" || role === "Super Admin";
}

module.exports = { isAdminRole };
