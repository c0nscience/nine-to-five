<script lang="ts">
  import { onMount } from 'svelte'
  import activitiesService from '../services/activities'
  import { activities } from '../stores/activities'
  import NavigationBar from '../components/NavigationBar.svelte'
  import { currentDate } from '../stores/navigation'

  onMount(async () => {
    await activitiesService.loadInRange($currentDate, $currentDate)
  })

  const onDateChanged = async (e) => {
    await activitiesService.loadInRange(e.detail, e.detail)
  }
</script>

<NavigationBar on:dateChanged={onDateChanged}/>
<div>
  Activities<br>
  {#if $activities}
    {$activities.length}
  {/if}
  <a class="btn btn-primary" href="/">Back</a>
</div>
