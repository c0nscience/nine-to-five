<script lang="ts">
  import { onMount } from 'svelte'
  import { useAuth0 } from './services/auth0'
  import PageLoader from './components/PageLoader.svelte'
  import Router from './components/pager/Router.svelte'
  import Route from './components/pager/Route.svelte'
  import LandingPage from './pages/LandingPage.svelte'
  import ActivitiesPage from './pages/ActivitiesPage.svelte'
  import NotFoundPage from './pages/NotFoundPage.svelte'
  import CallbackPage from './pages/CallbackPage.svelte'

  let { isLoading, isAuthenticated, login, initializeAuth0 } = useAuth0

  const authenticationGuard: PageJS.Callback = (ctx: PageJS.Context, next: () => any) => {
    if ($isAuthenticated) {
      next()
    } else {
      const appState = { targetUrl: ctx.pathname }
      login({ appState })
    }
  }

  const onRedirectCallback = (appState: any) => {
    window.history.replaceState(
      {},
      document.title,
      appState && (typeof appState.targetUrl === 'string')
        ? appState.targetUrl
        : window.location.pathname
    )
  }

  onMount(async () => {
    await initializeAuth0({ onRedirectCallback })
  })
</script>

<main>
  {#if $isLoading}
    <PageLoader/>
  {:else}
    <Router>
      <Route path="/" component={LandingPage}/>

      <Route path="/activities"
             middleware={[authenticationGuard]}
             component={ActivitiesPage}/>

      <Route path="/callback" component={CallbackPage}/>

      <Route path="*" component={NotFoundPage}/>
    </Router>
  {/if}
</main>
