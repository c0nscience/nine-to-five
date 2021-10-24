<script>
    import {onMount, onDestroy} from 'svelte';
    import auth from '$lib/services/auth';
    import {error, idToken, isAuthenticated, refreshToken, user} from '$lib/stores/auth';
    import {goto} from "$app/navigation";

    let auth0Client;

    const refreshRate = 10 * 60 * 60 * 1000;
    let tokenRefreshIntervalId;

    onMount(async () => {
        auth0Client = await auth.createClient();

        const params = new URLSearchParams(window.location.search);
        if (params.has('error')) {
            error.set(new Error(params.get('error_description')));
        }

        if (params.has('code')) {
            const {appState} = await auth0Client.handleRedirectCallback();
            console.log('appState', appState)
            error.set(null);
            await goto('/app');
        }
    });

    onDestroy(() => {
        clearInterval(tokenRefreshIntervalId);
    })
</script>
<div class="container mx-auto pt-12">
    <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 text-center">Logging in</h1>
</div>
