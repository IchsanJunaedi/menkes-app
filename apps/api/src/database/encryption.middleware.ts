import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT = 'sehatku-ehr-secure-salt-v1';

const getEncryptionKey = (): Buffer => {
    const secret = process.env.DB_PASSWORD || process.env.JWT_SECRET || 'dev-fallback-key';
    return crypto.scryptSync(secret, SALT, 32);
};

export function encrypt(text: string | null | undefined): string | null | undefined {
    if (!text || typeof text !== 'string') return text;
    // Skip if already encrypted by this middleware
    if (text.startsWith('enc:')) return text;

    // Use a deterministic IV (derived from the text) to allow exact-match searching for @unique columns like `nik`
    const iv = crypto.createHash('md5').update(text).digest();
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(text: string | null | undefined): string | null | undefined {
    if (!text || typeof text !== 'string' || !text.startsWith('enc:')) return text;

    try {
        const parts = text.split(':');
        /* istanbul ignore if */
        if (parts.length !== 4) return text;

        const iv = Buffer.from(parts[1], 'hex');
        const authTag = Buffer.from(parts[2], 'hex');
        const encrypted = parts[3];

        const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (e) {
        console.warn('[PrismaEncryption] Failed to decrypt field', e);
        return text;
    }
}

const encryptableFields = ['nik', 'addressProvince', 'addressCity'];

function processOutput(data: any): any {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(processOutput);
    }
    if (typeof data === 'object') {
        const result = { ...data };
        for (const [key, value] of Object.entries(result)) {
            if (encryptableFields.includes(key)) {
                result[key] = decrypt(value as string);
            } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
                result[key] = processOutput(value);
            }
        }
        return result;
    }
    return data;
}

function processInput(data: any): any {
    if (!data) return data;
    const result = { ...data };
    for (const [key, value] of Object.entries(result)) {
        if (encryptableFields.includes(key)) {
            result[key] = encrypt(value as string);
        } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
            result[key] = processInput(value);
        }
    }
    return result;
}

export const fieldEncryptionMiddleware: Prisma.Middleware = async (params, next) => {
    // Intercept mutation inputs
    if (['create', 'update', 'upsert', 'createMany', 'updateMany'].includes(params.action)) {
        if (params.args.data) {
            params.args.data = processInput(params.args.data);
        }
        if (params.action === 'upsert' && params.args.create) {
            params.args.create = processInput(params.args.create);
        }
        if (params.action === 'upsert' && params.args.update) {
            params.args.update = processInput(params.args.update);
        }
    }

    // Intercept lookups (e.g., search by nik)
    if (params.args && params.args.where) {
        params.args.where = processInput(params.args.where);
    }

    const result = await next(params);
    return processOutput(result);
};
