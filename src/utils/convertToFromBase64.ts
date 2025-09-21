export function convertToBase64(input: string): string {
    if (typeof Buffer !== 'undefined') {
        // Node.js environment
        return Buffer.from(input, 'utf-8').toString('base64');
    } else if (typeof btoa !== 'undefined') {
        // Browser environment
        return btoa(String.fromCharCode(...new TextEncoder().encode(input)));
    } else {
        throw new Error('No base64 encoding method available.');
    }
}

export function convertFromBase64(input: string): string {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(input, 'base64').toString('utf-8');
    } else if (typeof atob !== 'undefined') {
        return atob(input);
    } else {
        throw new Error('No base64 decoding method available.');
    }
}