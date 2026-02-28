import nodeVault from 'node-vault';

export async function loadVaultSecrets(): Promise<void> {
    const vaultUrl = process.env.VAULT_ADDR || 'http://localhost:8200';
    const vaultToken = process.env.VAULT_DEV_ROOT_TOKEN || 'dev-root-token';

    try {
        const vaultFn = (nodeVault as any).default || nodeVault;
        const client = vaultFn({
            apiVersion: 'v1',
            endpoint: vaultUrl,
            token: vaultToken,
        });

        // HashiCorp Vault v2 KV API puts data under 'data' key
        const result = await client.read('secret/data/sehatku');
        const secrets = result.data.data;

        // Inject secrets into process.env so config loaders and Prisma can map them successfully
        if (secrets.DB_PASSWORD) {
            process.env.DB_PASSWORD = secrets.DB_PASSWORD;
            // Automatically map database URL injecting the secure vault password replacing the stub
            if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('change_me_in_production')) {
                process.env.DATABASE_URL = process.env.DATABASE_URL.replace('change_me_in_production', secrets.DB_PASSWORD);
            }
        }

        if (secrets.MINIO_SECRET) {
            process.env.MINIO_SECRET = secrets.MINIO_SECRET;
        }

        if (secrets.KEYCLOAK_SECRET) {
            process.env.KEYCLOAK_SECRET = secrets.KEYCLOAK_SECRET;
        }

        console.log('[Vault] Successfully loaded secrets from Vault into environment');
    } catch (error: any) {
        console.warn('[Vault] Failed to load secrets from Vault:', error.message);
        // Throw only in production where Vault is mandatory
        if (process.env.NODE_ENV === 'production') {
            throw error;
        }
    }
}
