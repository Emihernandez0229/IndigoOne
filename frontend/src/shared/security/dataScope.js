
export function scopeByBranch(rows = [], user, getBranchId = (row) => row.branchId) {

  const allowed = user?.branchIds;

  if (!allowed) {
    return rows;
  }

  const allowedSet = new Set(allowed);

  return rows.filter((row) => allowedSet.has(getBranchId(row)));

}



export function hasGlobalBranchScope(user) {
  return !user?.branchIds;
}
