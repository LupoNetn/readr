import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

export const TEST_STORE_PATH = path.resolve(os.tmpdir(), `readr-test-store-${process.pid}.json`);
process.env.NODE_ENV = 'test';
process.env.STORE_PATH = TEST_STORE_PATH;

export function cleanupTestStore() {
    try {
        if (fs.existsSync(TEST_STORE_PATH)) {
            fs.unlinkSync(TEST_STORE_PATH);
        }
    } catch {
        // ignore cleanup errors
    }
}

