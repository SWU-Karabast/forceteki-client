import { DateFormat, IPreferences } from '@/app/_contexts/UserTypes';

export const DEFAULT_DATE_FORMAT = DateFormat.MonthFirst;

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
};

const LONG_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
};

// Matches what toLocaleDateString returns for an invalid date, so callers see the same text as before
const INVALID_DATE_TEXT = 'Invalid Date';

const toValidDate = (value: Date | string): Date | null => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Reads the date format from a preferences object, falling back to the default.
 * Use the useDateFormat hook in components, which also covers anonymous users.
 */
export const getDateFormat = (preferences?: IPreferences | null): DateFormat =>
    preferences?.gameOptions?.dateFormat ?? DEFAULT_DATE_FORMAT;

/**
 * Formats a date and time as "MM/DD/YYYY, hh:mm AM" or "DD/MM/YYYY, hh:mm AM".
 * Only the order of day and month depends on the date format; the time is formatted the same either way.
 */
export const formatDateTime = (value: Date | string, dateFormat: DateFormat = DEFAULT_DATE_FORMAT): string => {
    const date = toValidDate(value);
    if (!date) {
        return INVALID_DATE_TEXT;
    }

    const parts = new Intl.DateTimeFormat('en-US', DATE_TIME_OPTIONS).formatToParts(date);
    if (dateFormat !== DateFormat.DayFirst) {
        return parts.map((part) => part.value).join('');
    }

    // en-US puts the month first; swapping the two values keeps every separator in place
    const day = parts.find((part) => part.type === 'day')?.value ?? '';
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    return parts.map((part) => {
        if (part.type === 'day') {
            return month;
        }
        if (part.type === 'month') {
            return day;
        }
        return part.value;
    }).join('');
};

/**
 * Formats a date with the month written out: "October 1, 2026" or "1 October 2026".
 */
export const formatLongDate = (value: Date | string, dateFormat: DateFormat = DEFAULT_DATE_FORMAT): string => {
    const date = toValidDate(value);
    if (!date) {
        return INVALID_DATE_TEXT;
    }

    const locale = dateFormat === DateFormat.DayFirst ? 'en-GB' : 'en-US';
    return new Intl.DateTimeFormat(locale, LONG_DATE_OPTIONS).format(date);
};
