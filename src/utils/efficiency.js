export function calcEfficiency(school) {
  const capacity = (school.totalClassrooms || 0) * 35;
  if (capacity === 0) return null;
  return Math.round((school.totalStudents || 0) / capacity * 100);
}

export function efficiencyColor(value) {
  if (value === null || value === undefined) return null;
  return value >= 75 ? '#16a34a' : value >= 40 ? '#d97706' : '#dc2626';
}
