<script context="module" lang="ts">
  import { writable } from 'svelte/store'
  import type { Route } from './router.types.js'

  export const activeRoute = writable<Route>({} as Route)

  const routes: Record<string, any> = {}

  export function register(route: Route) {
    routes[route.path] = route
  }

</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import page from 'page'

  export let disabled = false
  export let basePath = ''

  const last = (route: Route) => {
    return function (ctx: PageJS.Context) {
      $activeRoute = {
        path: route.path,
        middleware: route.middleware,
        component: route.component,
        params: ctx.params
      }
    }
  }

  const setupPage = () => {
    for (let [path, route] of Object.entries(routes)) {
      page(path, ...route.middleware, last(route))
    }

    if (basePath !== '') {
      page.base(basePath)
    }

    page.start()
  }

  onMount(setupPage)

  onDestroy(page.stop)
</script>

{#if !disabled}
  <slot/>
{/if}
