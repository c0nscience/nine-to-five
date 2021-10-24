import createAuth0Client from '@auth0/auth0-spa-js';
import config from '$lib/config/auth_config';

async function createClient() {
    let auth0Client = await createAuth0Client({
        domain: config.domain,
        client_id: config.clientId,
        redirect_uri: 'http://localhost:3000/callback',
        audience: 'https://api.ntf.io',
        scope: 'openid read:activities start:activity stop:activity update:activity delete:activity read:metrics create:metrics delete:metrics update:metric',
        cacheLocation: 'localstorage',
        useRefreshTokens: true,
    });

    return auth0Client;
}

async function login(client, options) {
    await client.loginWithRedirect(options);
}

function logout(client) {
    return client.logout();
}

const auth = {
    createClient,
    login,
    logout,
};

export default auth;