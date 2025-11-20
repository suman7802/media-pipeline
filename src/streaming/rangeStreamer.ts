import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';

import fs from 'fs';

import { RangeHeader } from '@/helpers/helper';
import { ByteMapEntry } from '@/services/chunk.service';

interface RangeStreamerOptions {
    byteMap: ByteMapEntry[];
    range: RangeHeader;
    chunkSize: number;
    contentLength: number;
}

export class RangeStreamer extends Readable {
    private byteMap: ByteMapEntry[];
    private startByte: number;
    private endByte: number;
    private chunkSize: number;

    private currentChunkIndex: number;
    private currentPositionInStream: number;
    private currentFileStream: fs.ReadStream | null = null;

    constructor(options: RangeStreamerOptions) {
        super();
        this.byteMap = options.byteMap;
        this.startByte = options.range.start;
        this.endByte = options.range.end;
        this.chunkSize = options.chunkSize;

        this.currentChunkIndex = Math.floor(this.startByte / this.chunkSize);
        this.currentPositionInStream = this.startByte;
    }

    /**
     * Node.js Readable stream implementation. This method is called when the stream's consumer
     * is ready for more data.
     */
    _read(): void {
        if (this.currentPositionInStream > this.endByte) {
            this.push(null);
            return;
        }

        if (!this.currentFileStream) {
            this.openNextChunkStream();
        }
    }

    private openNextChunkStream(): void {
        if (this.currentChunkIndex >= this.byteMap.length) {
            this.push(null);
            return;
        }

        const chunkInfo = this.byteMap[this.currentChunkIndex];

        // Calculate start and end positions within the current chunk file.
        // The starting position in the file is the max of 0 or (requested_start - chunk_offset)
        const startInFile = Math.max(0, this.startByte - chunkInfo.offset);

        // The ending position is the min of the chunk size or (requested_end - chunk_offset)
        const endInFile = Math.min(chunkInfo.size - 1, this.endByte - chunkInfo.offset);

        this.currentFileStream = fs.createReadStream(chunkInfo.path, {
            start: startInFile,
            end: endInFile,
        });

        this.currentFileStream.on('data', (data: string | Buffer) => {
            this.currentPositionInStream += data.length;
            if (!this.push(data)) {
                // Backpressure: consumer is not ready for more data. Pause the file stream.
                this.currentFileStream?.pause();
            }
        });

        this.currentFileStream.on('end', () => {
            this.currentFileStream = null;
            this.currentChunkIndex++;

            // If we haven't finished the range, the next _read() call will open the next chunk
            if (this.currentPositionInStream <= this.endByte) this._read();
            else this.push(null);
        });

        this.currentFileStream.on('error', (err) => {
            this.destroy(err);
        });
    }

    /**
     * Overrides the default destroy method to ensure file streams are properly closed.
     */
    _destroy(err: Error | null, callback: (error?: Error | null) => void): void {
        if (this.currentFileStream) {
            this.currentFileStream.destroy();
            this.currentFileStream = null;
        }
        super._destroy(err, callback);
    }
}
