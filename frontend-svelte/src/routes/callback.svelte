<script>
  import {error} from '$lib/stores/auth'
  import {onMount} from 'svelte'
  import {auth0Client} from '$lib/services/auth'
  import {goto} from '$app/navigation'

  onMount(async () => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('error')) {
      error.set(new Error(params.get('error_description')))
    }

    if (params.has('code')) {
      await auth0Client.handleRedirectCallback()
      error.set(null)
    }

    const _isAuthenticated = await auth0Client.isAuthenticated()
    if (_isAuthenticated) {
      await goto('/app')
    } else {
      await goto('/')
    }
  })

</script>

<h1 class="text-4xl tracking-tight font-extrabold text-gray-200 text-center">Logging in</h1>
