import { normalizePhoneNumber } from './phone-utils';

describe('normalizePhoneNumber', () => {
    it('should normalize 10 digit numbers with 91 prefix', () => {
        expect(normalizePhoneNumber('9876543210')).toBe('919876543210');
    });

    it('should normalize numbers with spaces', () => {
        expect(normalizePhoneNumber('98765 43210')).toBe('919876543210');
    });

    it('should normalize numbers with + prefix', () => {
        expect(normalizePhoneNumber('+919876543210')).toBe('919876543210');
    });

    it('should normalize numbers with leading 0', () => {
        expect(normalizePhoneNumber('09876543210')).toBe('919876543210');
    });

    it('should keep 12 digit numbers starting with 91', () => {
        expect(normalizePhoneNumber('919876543210')).toBe('919876543210');
    });

    it('should return null for numbers with special characters (the issue)', () => {
        expect(normalizePhoneNumber('915684589@86')).toBeNull();
        expect(normalizePhoneNumber('987654321#')).toBeNull();
        expect(normalizePhoneNumber('987654321a')).toBeNull();
    });

    it('should return null for invalid lengths', () => {
        expect(normalizePhoneNumber('12345')).toBeNull();
        expect(normalizePhoneNumber('1234567890123')).toBeNull();
    });

    it('should return null for empty input', () => {
        expect(normalizePhoneNumber('')).toBeNull();
    });
});
