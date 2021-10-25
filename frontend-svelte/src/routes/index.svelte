<script>
  import {onDestroy, onMount} from 'svelte'
  import auth from '$lib/services/auth'
  import {idToken, isAuthenticated, refreshToken, user} from '$lib/stores/auth'

  let auth0Client

  const refreshRate = 10 * 60 * 60 * 1000
  let tokenRefreshIntervalId
  onMount(async () => {
    auth0Client = await auth.createClient()

    const _isAuthenticated = await auth0Client.isAuthenticated()
    isAuthenticated.set(_isAuthenticated)
    console.log('onmount $isAuthenticated', $isAuthenticated)
    if (_isAuthenticated) {
      const _user = await auth0Client.getUser()
      user.set(_user)
      const idTokenClaims = await auth0Client.getIdTokenClaims()
      idToken.set(idTokenClaims.__raw)
      refreshToken(auth0Client)
      tokenRefreshIntervalId = setInterval(refreshToken, refreshRate)
    }
  })

  onDestroy(() => {
    clearInterval(tokenRefreshIntervalId)
  })

  function login() {
    auth.login(auth0Client, {appState: {targetUrl: '/app'}})
  }

  function logout() {
    auth.logout(auth0Client)
  }
</script>

<svelte:head>
  <title>Nine to Five</title>
</svelte:head>

<div class="pt-6 px-4 sm:px-6 lg:px-8">
  <nav aria-label="Global" class="flex items-center justify-between sm:h-10 lg:justify-start">
    <div class="flex items-center flex-grow flex-shrink-0">
      <div class="flex items-center w-full md:w-auto">
        <span class="pl-2 text-2xl tracking-normal font-semibold text-gray-300">Nine to Five</span>
      </div>
    </div>
    {#if $isAuthenticated}
      <button on:click={logout}
              class="text-base font-semibold text-blue-600 hover:text-blue-800">
        Log Out
      </button>
    {:else}
      <button on:click={login}
              class="text-base font-semibold text-blue-600 hover:text-blue-800">
        Log In
      </button>
    {/if}
  </nav>
</div>

<main class="mt-8 mx-auto max-w-7xl px-4 sm:mt-10 sm:px-6 md:mt-14 lg:mt-18 lg:px-8">
  <div class="sm:text-center lg:text-left">
    <h1 class="text-4xl tracking-tight font-extrabold text-gray-200 sm:text-5xl md:text-6xl">
      <span class="block xl:inline">Know how much</span><br class="hidden xl:block">
      <span class="block text-blue-600 xl:inline">you work</span>
    </h1>
    <p class="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
      Know exactly how much you've worked and take over responsibility for your work life balance.
    </p>
    {#if $isAuthenticated}
      <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
        <div class="rounded-md shadow">
          <a href="/app"
             class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-800 md:py-4 md:text-lg md:px-10">
            Let's go
          </a>
        </div>
      </div>
    {/if}
  </div>
</main>
