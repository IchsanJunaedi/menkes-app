"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
const config_1 = require("@nestjs/config");
const zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    DATABASE_URL: zod_1.z.string().url(),
});
exports.default = (0, config_1.registerAs)('app', () => {
    const parsed = exports.envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error('Invalid environment variables', parsed.error.format());
        throw new Error('Invalid environment variables');
    }
    return parsed.data;
});
//# sourceMappingURL=env.config.js.map