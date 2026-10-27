const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { isAdminRole } = require("./authorization.js");

describe("isAdminRole", () => {
  it("allows only explicitly privileged roles", () => {
    assert.equal(isAdminRole("Admin"), true);
    assert.equal(isAdminRole("Super Admin"), true);
    assert.equal(isAdminRole("Supervisor"), false);
    assert.equal(isAdminRole("Desktop Support"), false);
    assert.equal(isAdminRole("admin@example.com"), false);
    assert.equal(isAdminRole(null), false);
    assert.equal(isAdminRole(undefined), false);
  });
});
