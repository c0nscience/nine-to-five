import { writable } from 'svelte/store';

export const isAuthenticated = writable(false);
export const user = writable({});
export const error = writable();
export const authToken = writable('');
export const idToken = writable('');

export async function refreshToken(auth0) {
    const token = await auth0.getTokenSilently();
    authToken.set(token);
}