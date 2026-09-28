/**
 * Get current Date converted to IST (Asia/Kolkata, UTC+5:30)
 */
function getNowIST() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(utc + istOffset);
}

/**
 * Get the current IST date string formatted as YYYY-MM-DD
 */
function getTodayISTDateString() {
  const ist = getNowIST();
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get human-readable IST date for morning digest header (e.g. "Mon, 28 Sep 2026")
 */
function getFormattedISTDate() {
  const ist = getNowIST();
  return ist.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
}

/**
 * Get start of day in UTC for a specific IST date (or today if omitted)
 */
function getStartOfDayUTC(istDateString) {
  const dateStr = istDateString || getTodayISTDateString();
  // IST midnight is (Date - 5:30 hrs) in UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  const istMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  return new Date(istMidnight.getTime() - (5.5 * 60 * 60 * 1000));
}

/**
 * Format a Date object into human-readable IST time
 */
function formatTimeIST(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
}

module.exports = {
  getNowIST,
  getTodayISTDateString,
  getFormattedISTDate,
  getStartOfDayUTC,
  formatTimeIST
};
