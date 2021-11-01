<script context="module">
  import dayjs from 'dayjs'

  /**
   * @type {import('@sveltejs/kit').Load}
   */
  export async function load({page}) {
    if (!dayjs(page.params.date).isValid()) {
      return {
        redirect: '/app',
        status: 302
      }
    }

    return {
      props: {
        date: page.params.date
      }
    }
  }
</script>

<script>
  import DaySwitcher from '$lib/list/DaySwitcher.svelte'
  import {onMount} from 'svelte'
  import {fetchActivities} from '$lib/services/activity'
  import {authToken} from '$lib/stores/auth'

  export let date

  onMount(async () => {
    console.log('$authToken', $authToken)
    await fetchActivities($authToken, date, date)
  })
</script>

<DaySwitcher {date}/>
