/**
 * Timezone and Time Slot Management Utilities
 * Handles all timezone-related operations for the application
 */

// Default timezone for the application
export const DEFAULT_TIMEZONE = 'Australia/Adelaide';

/**
 * Get the current date in the specified timezone
 * @param {string} timezone - The timezone (default: Australia/Adelaide)
 * @returns {Date} - Current date in the specified timezone
 */
export const getCurrentDateInTimezone = (timezone = DEFAULT_TIMEZONE) => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const targetTime = new Date(utc + (getTimezoneOffset(timezone) * 60000));
  return targetTime;
};

/**
 * Get timezone offset in minutes for a given timezone
 * @param {string} timezone - The timezone
 * @returns {number} - Offset in minutes
 */
export const getTimezoneOffset = (timezone) => {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const targetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return (targetDate.getTime() - utcDate.getTime()) / (1000 * 60);
};

/**
 * Convert a date to the specified timezone and format as YYYY-MM-DD
 * @param {Date} date - The date to convert
 * @param {string} timezone - The target timezone
 * @returns {string} - Formatted date string
 */
export const formatDateForTimezone = (date, timezone = DEFAULT_TIMEZONE) => {
  const options = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  return formatter.format(date);
};

/**
 * Parse a date string in the context of a specific timezone
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {string} timezone - The timezone context
 * @returns {Date} - Date object
 */
export const parseDateInTimezone = (dateString, timezone = DEFAULT_TIMEZONE) => {
  // Create date at midnight in the specified timezone
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create a date object that represents midnight in the target timezone
  const date = new Date();
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  
  // Adjust for timezone offset
  const offset = getTimezoneOffset(timezone);
  const utcOffset = date.getTimezoneOffset();
  const adjustment = (offset - utcOffset) * 60000;
  
  return new Date(date.getTime() - adjustment);
};

/**
 * Format time string to 12-hour format with AM/PM
 * @param {string} timeString - Time in HH:MM format
 * @returns {string} - Formatted time string
 */
export const formatTimeToAMPM = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Format time from hours and minutes to 12-hour format
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {string} - Formatted time string
 */
export const formatTimeFromNumbers = (hour, minute) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Check if a date is in the past relative to the timezone
 * @param {Date|string} date - Date to check
 * @param {string} timezone - Timezone context
 * @returns {boolean} - True if date is in the past
 */
export const isDateInPast = (date, timezone = DEFAULT_TIMEZONE) => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const currentDate = getCurrentDateInTimezone(timezone);
  
  // Compare just the date parts (ignore time)
  const checkDateStr = formatDateForTimezone(checkDate, timezone);
  const currentDateStr = formatDateForTimezone(currentDate, timezone);
  
  return checkDateStr < currentDateStr;
};

/**
 * Get the start of day for a date in a specific timezone
 * @param {Date} date - The date
 * @param {string} timezone - The timezone
 * @returns {Date} - Start of day in the timezone
 */
export const getStartOfDayInTimezone = (date, timezone = DEFAULT_TIMEZONE) => {
  const dateStr = formatDateForTimezone(date, timezone);
  return parseDateInTimezone(dateStr, timezone);
};

/**
 * Generate time options for dropdowns (every 30 minutes)
 * @returns {Array} - Array of time options with value and label
 */
export const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = formatTimeFromNumbers(hour, minute);
      options.push({ value: timeString, label: displayTime });
    }
  }
  return options;
};

/**
 * Validate if end time is after start time
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {boolean} - True if end time is after start time
 */
export const isEndTimeAfterStartTime = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return endMinutes > startMinutes;
};

/**
 * Get available dates for time slot creation (next 30 days)
 * @param {string} timezone - The timezone
 * @returns {Array<Date>} - Array of available dates
 */
export const getAvailableDates = (timezone = DEFAULT_TIMEZONE) => {
  const dates = [];
  const currentDate = getCurrentDateInTimezone(timezone);
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};