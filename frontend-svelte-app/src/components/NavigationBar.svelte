<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { currentDate } from '../stores/navigation'
  import { DateTime } from 'luxon'
  import { useAuth0 } from '../services/auth0'

  const dispatch = createEventDispatcher()

  $: isToday = $currentDate.toISODate() === DateTime.local().toISODate()
</script>

<div class="navbar bg-base-100">
  <div class="navbar-start">
    <div class="dropdown">
      <label class="btn btn-ghost btn-circle" tabindex="0">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6h16M4 12h16M4 18h7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
        </svg>
      </label>
      <ul class="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-200 rounded-box w-52" tabindex="0">
        <li on:click={() => {useAuth0.logout({logoutParams: {returnTo: window.location.origin}})}}><a>Logout</a></li>
      </ul>
    </div>
  </div>
  <div class="navbar-center">
    <!--    <a class="btn btn-ghost normal-case text-xl">daisyUI</a>-->
    <div class="btn-group">
      <button class="btn btn-ghost text-xl" on:click={() => {
        $currentDate = $currentDate.minus({day: 1})
        dispatch('dateChanged', $currentDate)
      }}>«
      </button>
      <button class="btn btn-ghost text-xl">{isToday ? 'Today' : $currentDate.toFormat('EEE, DD')}</button>
      <button class="btn btn-ghost text-xl" on:click={() => {
        $currentDate = $currentDate.plus({day: 1})
        dispatch('dateChanged', $currentDate)
      }}>»
      </button>
    </div>
  </div>
  <div class="navbar-end">
    <!--    <button class="btn btn-ghost btn-circle">-->
    <!--      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>-->
    <!--    </button>-->
    <!--    <button class="btn btn-ghost btn-circle">-->
    <!--      <div class="indicator">-->
    <!--        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>-->
    <!--        <span class="badge badge-xs badge-primary indicator-item"></span>-->
    <!--      </div>-->
    <!--    </button>-->
  </div>
</div>
