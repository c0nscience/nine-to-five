<script context="module">
  import dayjs from "dayjs";

  /**
   * @type {import('@sveltejs/kit').Load}
   */
  export async function load({page}) {
    if (!dayjs(page.params.date).isValid()){
      return {
        redirect: '/app',
        status: 302,
      }
    }

    return {
      props: {
        date: page.params.date,
      },
    }
  }
</script>

<script>
  import auth from '$lib/services/auth'
  import {onMount} from 'svelte'
  import DaySwitcher from "$lib/list/DaySwitcher.svelte";
  import {page} from "$app/stores";

  export let date
  onMount(async () => {
    const auth0Client = await auth.createClient()
    if (!await auth0Client.isAuthenticated()) {
      await auth.login(auth0Client, {appState: {targetUrl: $page.params.path}})
    }
  })
</script>

<DaySwitcher {date}/>

<div class="container mx-auto">
  <h1 class="text-4xl tracking-tight font-extrabold text-gray-200 text-center">App starts here</h1>
</div>
