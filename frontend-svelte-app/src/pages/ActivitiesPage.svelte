<script lang="ts">
  import { onMount } from 'svelte'
  import Card from '../components/activity/Card.svelte'
  import NavigationBar from '../components/NavigationBar.svelte'
  import SkeletonCard from '../components/SkeletonCard.svelte'
  import activitiesService from '../services/activities'
  import { activities } from '../stores/activities'
  import { currentDate } from '../stores/navigation'

  let promise: Promise<void>

  onMount(() => {
    promise = activitiesService.loadInRange($currentDate, $currentDate)
  })

  const onDateChanged = (e) => {
    promise = activitiesService.loadInRange(e.detail, e.detail)
  }
</script>

<NavigationBar on:dateChanged={onDateChanged}/>

<div class="container mx-auto px-5 relative py-16 grid grid-cols-1 gap-4">
  {#await promise}
    <SkeletonCard/>
    <SkeletonCard/>
    <SkeletonCard/>
  {:then _}
    {#each $activities as activity (activity.id)}
      <Card activity={activity}/>
    {/each}
  {/await}
</div>
