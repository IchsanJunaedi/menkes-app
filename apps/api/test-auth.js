const { spawn } = require('child_process');
const http = require('http');

async function getKeycloakToken() {
    return new Promise((resolve, reject) => {
        const data = new URLSearchParams({
            client_id: 'ehr-api',
            client_secret: 'ehr-api-secret-key-123',
            grant_type: 'client_credentials'
        }).toString();

        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/realms/ehr-system/protocol/openid-connect/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body).access_token);
                } else {
                    reject(new Error(`Failed to get token: ${res.statusCode} ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function runTest() {
    console.log('Fetching Keycloak Service Account Token for ehr-api...');
    let accessToken;
    try {
        accessToken = await getKeycloakToken();
        console.log('Successfully retrieved Keycloak Access Token.');
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }

    console.log('Starting NestJS API on port 3009...');
    const api = spawn('npx', ['nest', 'start'], {
        env: {
            ...process.env,
            PORT: '3009',
            DATABASE_URL: 'postgresql://ehr_user:change_me_in_production@localhost:5433/ehr_db',
            REDIS_URL: 'redis://:change_me_in_production@localhost:6380',
            KEYCLOAK_URL: 'http://localhost:8080',
            KEYCLOAK_REALM: 'ehr-system'
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
    });

    api.stdout.on('data', d => console.log(`[API]: ${d.toString().trim()}`));
    api.stderr.on('data', d => console.error(`[API ERR]: ${d.toString().trim()}`));

    setTimeout(() => {
        console.log('\n--- TEST Phase 1: Call POST /api/auth/logout ---');

        // We are testing whether the Jwt Guard and Decoder process this Client Credentials token to do token revocation
        const options = {
            hostname: 'localhost',
            port: 3009,
            path: '/api/auth/logout',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Length': 0
            }
        };

        const req = http.request(options, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log(`Logout Status: ${res.statusCode}`);
                console.log(`Logout Body: ${body}`);

                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log('\n--- TEST Phase 2: Calling /api/auth/logout again reused token ---');

                    setTimeout(() => {
                        const req2 = http.request(options, res2 => {
                            let body2 = '';
                            res2.on('data', c => body2 += c);
                            res2.on('end', () => {
                                console.log(`Revoke Test Status: ${res2.statusCode}`);
                                console.log(`Revoke Test Body: ${body2}`);

                                if (res2.statusCode === 401) {
                                    console.log('\n✅ VERIFICATION SUCCESS: Redis Blacklist rejected the revoked Keycloak Token!');
                                    api.kill('SIGTERM');
                                    process.exit(0);
                                } else {
                                    console.error('\n❌ VERIFICATION FAILED: Token was STILL ACCEPTED after logout!');
                                    api.kill('SIGTERM');
                                    process.exit(1);
                                }
                            });
                        });
                        req2.end();
                    }, 2000);
                } else {
                    console.error('\n❌ VERIFICATION FAILED: Logout endpoint threw an error!');
                    api.kill('SIGTERM');
                    process.exit(1);
                }
            });
        });

        req.on('error', e => {
            console.error(`Error: ${e.message}`);
            api.kill('SIGTERM');
            process.exit(1);
        });

        req.end();
    }, 10000);
}

runTest();
