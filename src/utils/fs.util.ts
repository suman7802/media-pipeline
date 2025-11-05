import fs from 'fs/promises';
import path from 'path';

/**
 * Joins path segments and resolves them to an absolute path, ensuring the result
 * is still within the intended base directory. Throws an error if a directory
 * traversal attack is detected.
 * @param {string} baseDir - The trusted base directory.
 * @param {...string} segments - The path segments to join.
 * @returns {string} The resolved, validated absolute path.
 * @throws {Error} If the resolved path is outside the base directory.
 */
export const safeJoin = (baseDir: string, ...segments: string[]): string => {
    const resolvedBase = path.resolve(baseDir);
    const resolvedPath = path.resolve(resolvedBase, ...segments);

    if (!resolvedPath.startsWith(resolvedBase)) {
        throw new Error(`Path traversal attempt detected. Final path "${resolvedPath}" is outside of base "${resolvedBase}"`);
    }

    return resolvedPath;
};

/**
 * Creates a directory and any necessary parent directories, silently succeeding
 * if the directory already exists. Equivalent to `mkdir -p`.
 * @param {string} dirPath - The absolute path of the directory to create.
 * @returns {Promise<void>}
 */
export const makeDir = async (dirPath: string): Promise<void> => {
    try {
        const status = await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') throw error;
    }
};

/**
 * Pads a number with leading zeros to a specified length.
 * @param {number} num - The number to pad.
 * @param {number} length - The desired total length of the string.
 * @returns {string} The zero-padded number as a string.
 * @example zeroPad(5, 4) // "0005"
 */
export const zeroPad = (num: number, length: number): string => {
    return String(num).padStart(length, '0');
};
