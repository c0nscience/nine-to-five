<script lang="ts">
    import { onMount } from 'svelte'
    import Card from '../components/activity/Card.svelte'
    import NavigationBar from '../components/NavigationBar.svelte'
    import SkeletonCard from '../components/SkeletonCard.svelte'
    import StartButton from '../components/StartButton.svelte'
    import activitiesService from '../services/activities'
    import { activities } from '../stores/activities'
    import { currentDate } from '../stores/navigation'

    let promise: Promise<void>

    onMount(() => {
        promise = activitiesService.loadInRange($currentDate, $currentDate)
    })

    const onDateChanged = (e: any) => {
        promise = activitiesService.loadInRange(e.detail, e.detail)
    }
</script>

<NavigationBar on:dateChanged={onDateChanged}/>

<div class="container mx-auto px-5 relative py-16 grid grid-cols-1 gap-4">
    {#await promise}
        <SkeletonCard/>
        <SkeletonCard/>
        <SkeletonCard/>
        <SkeletonCard last={true}/>
    {:then _}
        {#each $activities as activity, idx (activity.id)}
            {activity.start.toFormat('T')}
            <Card activity={activity}/>
            {(idx === $activities.length - 1) ? (activity.end?.toFormat('T') ?? '') : ''}
        {:else}
            <h1>No activities entered yet.</h1>
        {/each}
    {:catch error}
        <p>Something went wrong: {error.message}</p>
    {/await}
</div>

<div class="absolute bottom-5 right-5">
    <StartButton/>
</div>
