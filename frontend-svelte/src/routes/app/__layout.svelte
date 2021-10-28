<script>
  import auth, {auth0Client} from '$lib/services/auth'
  import {onMount} from 'svelte'
  import {page} from "$app/stores";
  import {isAuthenticated} from "$lib/stores/auth";

  onMount(() => {
    // note to shelf: using the timeout to put the check later in the event loop
    setTimeout(async () => {
      if (!$isAuthenticated) {
        await auth.login(auth0Client, {appState: {targetUrl: $page.params.path}})
      }
    }, 0)
  })
</script>

<slot/>
