/**
 * Generates a unique id for a toast.
 * The function generates a unique id by combining the current timestamp with a random string.
 * The function returns the unique id as a string.
 * @returns {string} - The unique id.
 * @example
 * const id = genid();
 */
export const genid = () => {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 12).padStart(12, 0)
    );
}