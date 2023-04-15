<script lang="ts">
  import { useAuth0 } from '../services/auth0'

  let { error } = useAuth0
</script>

{#if $error}
  <div>
    {$error.message}
  </div>
{:else}
  <div>
    Logging in ...
  </div>
{/if}
