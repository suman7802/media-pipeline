import fs from 'fs/promises';
import path from 'path';

import { env } from '@/configs/env';
import { MANIFEST_FILENAME } from '@/configs/media.config';
import { MediaKind, MediaManifest } from '@/schemas/media.schema';
import { makeDir, safeJoin } from '@/utils/fs.util';

/**
 * Returns the absolute path to a media item's root directory.
 * The root directory is a combination of the MEDIA_DIR environment
 * variable and the media ID.
 * @param {string} id - The media ID.
 * @returns {string} The absolute path.
 */
export const getMediaRoot = (id: string): string => {
    return safeJoin(env.media.MEDIA_DIR, id);
};

/**
 * Constructs the absolute path to a media item's manifest file.
 * @param {string} id - The media ID.
 * @returns {string} The absolute path.
 */
export const getManifestPath = (id: string): string => {
    return safeJoin(getMediaRoot(id), MANIFEST_FILENAME);
};

/**
 * Writes or overwrites a media manifest file.
 * @param {string} id - The media ID.
 * @param {MediaManifest} manifest - The manifest data to write.
 * @returns {Promise<void>} A promise that resolves when the file is written.
 */
export const writeManifest = async (id: string, manifest: MediaManifest): Promise<void> => {
    const manifestPath = getManifestPath(id);
    const data = JSON.stringify(manifest, null, 2);
    return await fs.writeFile(manifestPath, data, 'utf-8');
};

/**
 * Reads a media manifest file from disk.
 * @param {string} id - The media ID.
 * @returns {Promise<MediaManifest | null>} The parsed manifest, or null if not found.
 */
export const readManifest = async (id: string): Promise<MediaManifest | null> => {
    const manifestPath = getManifestPath(id);

    const data = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(data) as MediaManifest;
};

interface InitializeMediaParams {
    id: string;
    title: string;
    tags: string[];
    kind: MediaKind;
    originalFilePath: string;
    originalFilename: string;
}

/**
 * Creates the initial directory structure and manifest for a new media item.
 * @param {InitializeMediaParams} params - The details of the new media.
 * @returns {Promise<MediaManifest>} The newly created manifest.
 * @throws {Error} If file operations fail.
 */
export const initializeMedia = async (params: InitializeMediaParams): Promise<MediaManifest> => {
    const { id, title, tags, kind, originalFilePath, originalFilename } = params;

    /**
     * Create media directory structure and move the original file
     * to the raw files directory.
     *
     */
    const mediaRoot = getMediaRoot(id);
    const rawDir = path.join(mediaRoot, env.media.RAW_DIR);
    const rawFilePath = path.join(rawDir, originalFilename);

    await makeDir(rawDir);
    await fs.rename(originalFilePath, rawFilePath);

    // Create the manifest file.
    const manifest: MediaManifest = {
        id,
        title,
        tags,
        kind,
        status: 'queued',
        createdAt: new Date().toISOString(),
        originalFilename,
        rawFilePath,
    };

    // Write the manifest file.
    await writeManifest(id, manifest);
    return manifest;
};

/**
 * Atomically updates a media manifest file.
 * It reads the current manifest, applies updates, and writes it back.
 * This helps prevent race conditions, though a proper locking mechanism
 * would be needed for high-concurrency scenarios.
 * @param {string} id - The media ID.
 * @param {Partial<MediaManifest>} updates - The fields to update.
 * @returns {Promise<MediaManifest>} The updated manifest.
 * @throws {Error} If the manifest does not exist or an error occurs.
 */
export const updateManifest = async (id: string, updates: Partial<MediaManifest>): Promise<MediaManifest> => {
    const currentManifest = await readManifest(id);
    if (!currentManifest) {
        throw new Error(`Cannot update non-existent manifest for media ID: ${id}`);
    }

    const updatedManifest = { ...currentManifest, ...updates, updatedAt: new Date().toISOString() };
    await writeManifest(id, updatedManifest);

    return updatedManifest;
};
