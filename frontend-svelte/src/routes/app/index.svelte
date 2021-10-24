<script>
  import auth from '$lib/services/auth'
  import Header from '$lib/Header.svelte'
  import {onMount} from 'svelte'

  let auth0Client
  onMount(async () => {
    auth0Client = await auth.createClient()
    const _isAuthenticated = await auth0Client.isAuthenticated()
    console.log('onmount _isAuthenticated', _isAuthenticated)
    if (!_isAuthenticated) {
      await auth.login(auth0Client, {appState: {targetUrl: '/app'}})
    }
  })
</script>

<Header/>

<div class="container mx-auto">
  <h1 class="text-4xl tracking-tight font-extrabold text-gray-200 text-center">App starts here</h1>
</div>
