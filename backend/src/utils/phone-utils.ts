/**
 * Normalizes a phone number based on specific rules for WhatsApp Bulk Messaging.
 * Expected format: 91XXXXXXXXXX
 * 
 * Rules:
 * 1. Remove spaces
 * 2. Remove "+" prefix
 * 3. Remove leading "0"
 * 4. If length is 10, add "91" prefix
 * 5. If length is 12, must start with "91"
 * 6. Otherwise, return null (invalid)
 */
export function normalizePhoneNumber(phone: string): string | null {
    if (!phone) return null;

    // 1. Remove spaces and + prefix
    let normalized = phone.replace(/[\s+]/g, '');

    // 2. Remove leading "0" if it's there
    if (normalized.startsWith('0')) {
        normalized = normalized.substring(1);
    }

    // 3. STRICT CHECK: Must be only digits now
    if (!/^\d+$/.test(normalized)) {
        return null;
    }

    // 4. Handle 10 digit numbers
    if (normalized.length === 10) {
        return '91' + normalized;
    }

    // 5. Handle 12 digit numbers (must start with 91)
    if (normalized.length === 12 && normalized.startsWith('91')) {
        return normalized;
    }

    // 6. Invalid length or format
    return null;
}
