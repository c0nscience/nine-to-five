<script>
  import {onMount} from 'svelte';
  import {isAuthenticated} from '$lib/stores/auth';
  import {goto} from "$app/navigation";
  import {page} from "$app/stores";

  onMount(() => {
    console.log('routes/callback.svelte', 'onMount', 'path', $page.path)
    setTimeout(async () => {
      console.log('routes/callback.svelte', 'onMount', 'path', $page.path, 'setTimeout')
      // const params = new URLSearchParams(window.location.search);
      // if (params.has('error')) {
      //   error.set(new Error(params.get('error_description')));
      // }
      //
      // if (params.has('code')) {
      //   const {appState} = await auth0Client.handleRedirectCallback();
      //   console.log('routes/callback.svelte', 'onMount', 'setTimeout', 'appState', appState)
      //   error.set(null);
      // }

      console.log('routes/callback.svelte', 'onMount', 'path', $page.path, 'setTimeout', '$isAuthenticated', $isAuthenticated)
      // ah that make sense we are here already in the SPA ... so we need to fill the store here for it to properly work
      if ($isAuthenticated) {
        await goto('/app');
      } else {
        await goto('/');
      }
    }, 0)
  });
</script>

<h1 class="text-4xl tracking-tight font-extrabold text-gray-900 text-center">Logging in</h1>
