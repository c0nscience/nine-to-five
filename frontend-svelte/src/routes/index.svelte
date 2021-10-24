<script>
    import {onMount, onDestroy} from 'svelte';
    import auth from '$lib/services/auth';
    import {idToken, isAuthenticated, refreshToken, user} from '$lib/stores/auth';

    let auth0Client;

    const refreshRate = 10 * 60 * 60 * 1000;
    let tokenRefreshIntervalId;
console.log('$isAuthenticated', $isAuthenticated)
    onMount(async () => {
        auth0Client = await auth.createClient();

        const _isAuthenticated = await auth0Client.isAuthenticated();
        isAuthenticated.set(_isAuthenticated);
        console.log('onmount $isAuthenticated', $isAuthenticated)
        if (_isAuthenticated) {
            const _user = await auth0Client.getUser();
            user.set(_user);
            const idTokenClaims = await auth0Client.getIdTokenClaims();
            idToken.set(idTokenClaims.__raw);
            refreshToken(auth0Client);
            tokenRefreshIntervalId = setInterval(refreshToken, refreshRate);
        }
    });

    onDestroy(() => {
        clearInterval(tokenRefreshIntervalId);
    })

    function login() {
        auth.login(auth0Client, {appState: {targetUrl: "/app"}});
    }

    function logout() {
        auth.logout(auth0Client);
    }
</script>

<svelte:head>
    <title>Home</title>
</svelte:head>

<div class="container mx-auto z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:pb-28 xl:pb-32">
    <div class="pt-6 px-4 sm:px-6 lg:px-8">
        <nav class="flex items-center justify-between sm:h-10 lg:justify-start" aria-label="Global">
            <div class="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
                <div class="flex items-center w-full md:w-auto">
                    <a href="#">
                        <img class="h-12 w-auto sm:h-14" src="logo.svg"
                             alt="three clocks with arrows to show time passing">
                    </a>
                    <span class="pl-2 text-2xl tracking-normal font-semibold text-gray-900">Nine to Five</span>
                </div>
            </div>
        </nav>
    </div>

    <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
        <div class="sm:text-center lg:text-left">
            <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span class="block xl:inline">Know how much</span><br class="hidden xl:block">
                <span class="block text-indigo-600 xl:inline">you work</span>
            </h1>
            <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Know exactly how much you've worked and take over responsibility for your work life balance.
            </p>
            {#if $isAuthenticated}
                <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div class="rounded-md shadow">
                        <button on:click={logout}
                                class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 md:py-4 md:text-lg md:px-10">
                            Log Out
                        </button>
                    </div>
                </div>
            {:else}
                <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div class="rounded-md shadow">
                        <button on:click={login}
                                class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                            Log In
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </main>
</div>