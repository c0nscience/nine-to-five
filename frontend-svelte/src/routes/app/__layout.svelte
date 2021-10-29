<script>
  import auth, {auth0Client} from '$lib/services/auth'
  import {onMount} from 'svelte'
  import {page} from "$app/stores";
  import {isAuthenticated} from "$lib/stores/auth";

  onMount(() => {
    //todo after the login from the landing page we don't register that the user is authenticated even though he is
    console.log('routes/app/__layout.svelte', 'onMount', 'path', $page.path, $isAuthenticated)
    // note to shelf: using the timeout to put the check later in the event loop
    setTimeout(async () => {
      console.log('routes/app/__layout.svelte', 'onMount', 'path', $page.path, 'setTimeout', $isAuthenticated)
      if (!$isAuthenticated) {
        await auth.login(auth0Client, {appState: {targetUrl: $page.params.path}})
      }
    }, 1)
  })
</script>

<slot/>
