<script>
  import ChevronRight from '$lib/icons/ChevronRight.svelte'
  import ChevronLeft from '$lib/icons/ChevronLeft.svelte'
  import dayjs from "dayjs"

  export let date
  console.log('date', date)
  $: _date = dayjs(date)
</script>

<div class="flex items-center mt-2 mb-2">
  <a class="flex-grow-0 text-blue-600 hover:text-blue-800"
     href="/app/{_date.subtract(1, 'day').format('YYYY-MM-DD')}">
    <ChevronLeft/>
  </a>
  <span class="flex-grow text-base text-semibold text-gray-200 text-center">
    {_date.format('dd. MMM D, YYYY')}
  </span>
  <a class="flex-grow-0 text-blue-600 hover:text-blue-800"
     href="/app/{_date.add(1, 'day').format('YYYY-MM-DD')}">
    <ChevronRight/>
  </a>
</div>
