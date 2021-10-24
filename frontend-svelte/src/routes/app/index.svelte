<script>
  import auth from '$lib/services/auth'
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

<div class="container mx-auto pt-12">
    <h1 class="text-4xl tracking-tight font-extrabold text-gray-300 text-center">App starts here</h1>
</div>