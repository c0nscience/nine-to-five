<script>
  import '../tailwind.css'
  import '../app.css'
  import {onDestroy, onMount} from "svelte";
  import auth, {auth0Client} from "$lib/services/auth";
  import {idToken, isAuthenticated, refreshToken, user} from "$lib/stores/auth";

  let isClientCreated = false;
  const minutes = 60 * 60 * 1000
  const refreshRate = 10 * minutes
  let tokenRefreshIntervalId

  onDestroy(() => {
    clearInterval(tokenRefreshIntervalId)
  })

  onMount(async () => {
    await auth.createClient()
    isClientCreated = true

    const _isAuthenticated = await auth0Client.isAuthenticated()
    isAuthenticated.set(_isAuthenticated)

    if (_isAuthenticated) {
      const _user = await auth0Client.getUser()
      user.set(_user)
      const idTokenClaims = await auth0Client.getIdTokenClaims()
      idToken.set(idTokenClaims.__raw)
      await refreshToken(auth0Client)
      tokenRefreshIntervalId = setInterval(refreshToken, refreshRate)
    }
  });
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
