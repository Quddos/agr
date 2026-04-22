export function canDeleteRecords(role) {
  return role === "admin" || role === "manager";
}

export function canManageUsers(role) {
  return role === "admin" || role === "manager";
}

export function canChangeRole(role) {
  return role === "admin";
}
