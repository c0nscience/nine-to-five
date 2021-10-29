<script>
  import '../tailwind.css'
  import '../app.css'
  import {onDestroy, onMount} from "svelte";
  import auth, {auth0Client} from "$lib/services/auth";
  import {error, idToken, isAuthenticated, refreshToken, user} from "$lib/stores/auth";
  import {page} from "$app/stores";

  let isClientCreated = false;
  const minutes = 60 * 60 * 1000
  const refreshRate = 10 * minutes
  let tokenRefreshIntervalId

  onMount(async () => {
    console.log('routes/__layout.svelte', 'onMount', 'path', $page.path)
    // setTimeout(async () => {
    await auth.createClient()
    isClientCreated = true
    console.log('routes/__layout.svelte', 'onMount', 'path', $page.path, 'setTimeout', 'client created')

    const params = new URLSearchParams(window.location.search);
    if (params.has('error')) {
      console.log('routes/__layout.svelte', 'onMount', 'path', $page.path, 'setTimeout', 'got error')
      error.set(new Error(params.get('error_description')));
    }

    if (params.has('code')) {
      console.log('routes/__layout.svelte', 'onMount', 'path', $page.path, 'setTimeout', 'got code')
      try {
        const {appState} = await auth0Client.handleRedirectCallback();
        console.log('routes/__layout.svelte', 'onMount', 'path', $page.path, 'setTimeout', 'appState', appState)
      } catch (e) {
        console.log('routes/__layout.svelte', 'onMount', 'path', $page.path, 'setTimeout', 'handleRedirectCallback failed', e)
      }
      error.set(null);
    }

    const _isAuthenticated = await auth0Client.isAuthenticated()
    isAuthenticated.set(_isAuthenticated)
    console.log('routes/__layout.svelte', 'onMount', 'path', $page.path, 'setTimeout', 'isAuthenticated', _isAuthenticated)

    if (_isAuthenticated) {
      const _user = await auth0Client.getUser()
      user.set(_user)
      const idTokenClaims = await auth0Client.getIdTokenClaims()
      idToken.set(idTokenClaims.__raw)
      await refreshToken(auth0Client)
      tokenRefreshIntervalId = setInterval(refreshToken, refreshRate)
    }
    // })
  });

  onDestroy(() => {
    clearInterval(tokenRefreshIntervalId)
  })
</script>

<svelte:head>
  <title>Nine to Five</title>
</svelte:head>

<main class="main-container">
  {#if isClientCreated}
    <slot/>
  {:else}
    Loading..
  {/if}
</main>
