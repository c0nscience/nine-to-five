<script lang="ts">
  import type { ComponentType } from 'svelte'
  import { activeRoute, register } from './Router.svelte'

  export let path = '/'
  export let component: ComponentType
  export let middleware: PageJS.Callback[] = []

  let params = {}

  register({ path, component, middleware })

  $: if ($activeRoute.path === path) {
    params = $activeRoute.params
  }
</script>

{#if $activeRoute.path === path}
  {#if $activeRoute.component}
    <svelte:component
      this={$activeRoute.component}
      {...$$restProps}
      {...params}
    />
  {:else}
    <slot {params}/>
  {/if}
{/if}
