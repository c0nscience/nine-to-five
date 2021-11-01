import createAuth0Client from '@auth0/auth0-spa-js';
import config from '$lib/config/auth_config';

export let auth0Client

async function createClient() {
    auth0Client = await createAuth0Client({
        domain: config.domain,
        client_id: config.clientId,
        redirect_uri: `${process.env.SVELTE_APP_URL}/callback`,
        audience: 'https://api.ntf.io',
        scope: 'openid read:activities start:activity stop:activity update:activity delete:activity read:metrics create:metrics delete:metrics update:metric',
        cacheLocation: 'localstorage',
        useRefreshTokens: true,
    });
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
