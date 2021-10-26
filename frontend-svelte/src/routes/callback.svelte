<script>
  import {onMount} from 'svelte';
  import auth from '$lib/services/auth';
  import {error} from '$lib/stores/auth';
  import {goto} from "$app/navigation";

  let auth0Client;

  onMount(async () => {
    auth0Client = await auth.createClient();

    const params = new URLSearchParams(window.location.search);
    if (params.has('error')) {
      error.set(new Error(params.get('error_description')));
    }

    if (params.has('code')) {
      const {appState} = await auth0Client.handleRedirectCallback();
      console.log('appState', appState)
      error.set(null);
      await goto('/app');
    }
  });
</script>

<h1 class="text-4xl tracking-tight font-extrabold text-gray-900 text-center">Logging in</h1>
