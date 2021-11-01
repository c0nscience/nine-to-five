<script>
  import auth, {auth0Client} from '$lib/services/auth'
  import {onMount} from 'svelte'
  import {page} from '$app/stores'
  import {isAuthenticated} from '$lib/stores/auth'

  onMount(async () => {
    const _isAuthenticated = await auth0Client.isAuthenticated()
    isAuthenticated.set(_isAuthenticated)
    if (!_isAuthenticated) {
      await auth.login(auth0Client, {appState: {targetUrl: $page.params.path}})
    }
  })
</script>

<slot/>
