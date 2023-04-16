<script lang="ts">
  import { Duration } from 'luxon'
  import type { Activity } from '../../stores/activities'

  export let activity: Activity

  let duration: Duration = Duration.fromMillis(0)
  if (activity && activity.end && activity.start) {
    duration = activity.end.diff(activity.start)
  }
</script>

<div class="card card-compact card-side bg-base-200">
  <figure class="text-4xl pl-5 pr-2">
    {duration.toFormat('h\'h\' mm\'m\'')}
  </figure>
  <div class="card-body">
    <h2 class="card-title">{activity.name}</h2>
    <p>{activity.tags}</p>
  </div>
</div>
