/**
 * adminUtils.js
 * Shared utilities for the admin panel.
 * Centralizes status normalization, department icon mapping,
 * and Firestore Timestamp formatting so every screen uses one source of truth.
 */

// ─────────────────────────────────────────────
// STATUS NORMALIZATION
// Citizen app writes lowercase ("pending").
// Admin UI displays title-case ("Pending").
// This util lets both coexist without mismatches.
// ─────────────────────────────────────────────

/** Canonical title-case statuses used for display & Firestore writes from admin */
export const STATUS_PENDING    = 'pending';
export const STATUS_ASSIGNED   = 'assigned';
export const STATUS_IN_PROGRESS = 'inProgress';
export const STATUS_RESOLVED   = 'resolved';
export const STATUS_CLOSED     = 'closed';

/**
 * Normalizes any status string the citizen app or admin might write
 * into a single lowercase canonical key used for matching.
 *   "Pending"     → "pending"
 *   "In Progress" → "inProgress"
 *   "inProgress"  → "inProgress"
 *   "assigned"    → "assigned"
 */
export function normalizeStatus(raw) {
  if (!raw) return STATUS_PENDING;
  const map = {
    pending:     STATUS_PENDING,
    assigned:    STATUS_ASSIGNED,
    'in progress': STATUS_IN_PROGRESS,
    inprogress:  STATUS_IN_PROGRESS,
    resolved:    STATUS_RESOLVED,
    closed:      STATUS_CLOSED,
  };
  return map[raw.toLowerCase().replace(/\s+/g, ' ')] || raw.toLowerCase();
}

/**
 * Human-readable display label for a status key.
 * Pass through t() in the component for i18n if needed.
 */
export function statusDisplayLabel(status) {
  const labels = {
    pending:    'Pending',
    assigned:   'Assigned',
    inProgress: 'In Progress',
    resolved:   'Resolved',
    closed:     'Closed',
  };
  return labels[normalizeStatus(status)] || status;
}

// ─────────────────────────────────────────────
// DEPARTMENT → IONICONS MAPPING
// Each department has a canonical Ionicons name + a tint color.
// When we create/fetch departments we store { name, iconName, color }.
// Fallback icon for unknown departments: "help-circle-outline"
// ─────────────────────────────────────────────

export const DEPARTMENT_ICONS = {
  // key is the lowercase department name
  'animal rescue':  { iconName: 'paw',                  color: '#f59e0b' },   // amber
  'sewerage':       { iconName: 'layers',               color: '#78716c' },   // stone
  'water':          { iconName: 'water-drop',           color: '#3b82f6' },   // blue
  'sanitation':     { iconName: 'trash',                color: '#64748b' },   // slate
  'electricity':    { iconName: 'flash',                color: '#eab308' },   // yellow
  'roads':          { iconName: 'car',                  color: '#f97316' },   // orange
  'parks':          { iconName: 'leaf',                 color: '#22c55e' },   // green
  'health':         { iconName: 'medical',              color: '#ef4444' },   // red
  'education':      { iconName: 'school',               color: '#8b5cf6' },   // violet
  'public safety':  { iconName: 'shield',               color: '#ec4899' },   // pink
};

const FALLBACK_ICON = { iconName: 'help-circle-outline', color: '#6366f1' };

/**
 * Given a department name (or object with .name), return { iconName, color }.
 */
export function getDeptIcon(nameOrObj) {
  const name = typeof nameOrObj === 'string' ? nameOrObj : nameOrObj?.name || '';
  return DEPARTMENT_ICONS[name.toLowerCase()] || FALLBACK_ICON;
}

// ─────────────────────────────────────────────
// FIRESTORE TIMESTAMP → JS Date
// createdAt from Firestore can be:
//   • a Firestore Timestamp object  → has .toDate()
//   • a plain object { seconds, nanoseconds } → multiply seconds * 1000
//   • an ISO string or number       → new Date(value)
// ─────────────────────────────────────────────

export function toJSDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();   // Firestore Timestamp
  if (value.seconds != null)             return new Date(value.seconds * 1000); // plain object
  return new Date(value);                                          // string / number
}

export function formatDate(value) {
  const d = toJSDate(value);
  if (!d || isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString();
}

export function formatDateTime(value) {
  const d = toJSDate(value);
  if (!d || isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString();
}

// ─────────────────────────────────────────────
// STATUS COLORS (used in badges, banners, progress bars)
// ─────────────────────────────────────────────

export const STATUS_COLORS = {
  pending:    { bg: '#fef3c7', text: '#92400e' },   // amber
  assigned:   { bg: '#dbeafe', text: '#1e40af' },   // blue
  inProgress: { bg: '#e0e7ff', text: '#3730a3' },   // indigo
  resolved:   { bg: '#d1fae5', text: '#065f46' },   // green
  closed:     { bg: '#f3f4f6', text: '#374151' },   // gray
};

export function getStatusStyle(rawStatus) {
  return STATUS_COLORS[normalizeStatus(rawStatus)] || STATUS_COLORS.pending;
}
