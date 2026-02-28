import { z } from 'zod';
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        production: "production";
        test: "test";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_URL: z.ZodString;
}, z.core.$strip>;
declare const _default: (() => {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
}>;
export default _default;
//# sourceMappingURL=env.config.d.ts.map