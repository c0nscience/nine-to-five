<script lang="ts">
  import { DateTime } from 'luxon'
  import { createEventDispatcher } from 'svelte'
  import { useAuth0 } from '../services/auth0'
  import { currentDate } from '../stores/navigation'

  const dispatch = createEventDispatcher()

  $: isToday = $currentDate.toISODate() === DateTime.local().toISODate()
</script>

<nav class="fixed top-0 z-50 navbar bg-base-100">
  <div class="navbar-start">
    <div class="dropdown">
      <button class="btn btn-ghost btn-circle">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6h16M4 12h16M4 18h7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
        </svg>
      </button>
      <ul class="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-200 rounded-box w-52">
        <li>
          <button class="btn btn-sm"
                  on:click={() => {useAuth0.logout({logoutParams: {returnTo: window.location.origin}})}}>Logout
          </button>
        </li>
      </ul>
    </div>
  </div>
  <div class="navbar-center">
    <!--    <a class="btn btn-ghost normal-case text-xl">daisyUI</a>-->
    <div class="btn-group">
      <button class="btn btn-ghost text-xl" data-testid="prev-btn"
              on:click={() => {
        $currentDate = $currentDate.minus({days: 1})
        dispatch('dateChanged', $currentDate)
      }}>«
      </button>

      <button class="btn btn-ghost text-xl w-56"
              data-testid="current-date-label"
              on:click={() => {
                $currentDate = DateTime.local()
                dispatch('dateChanged', $currentDate)
              }}>{isToday ? 'Today' : $currentDate.toFormat('EEE, DD')}</button>

      <button class="btn btn-ghost text-xl" data-testid="next-btn"
              on:click={() => {
        $currentDate = $currentDate.plus({days: 1})
        dispatch('dateChanged', $currentDate)
      }}>»
      </button>
    </div>
  </div>
  <div class="navbar-end">
  </div>
</nav>
