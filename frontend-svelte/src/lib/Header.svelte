<script>
  import ChevronRight from '$lib/icons/ChevronRight.svelte'
  import ChevronLeft from '$lib/icons/ChevronLeft.svelte'
</script>

<div class="flex items-center mt-2 mb-2">
  <button class="flex-grow-0 text-blue-600 hover:text-blue-800">
    <ChevronLeft/>
  </button>
  <span class="flex-grow text-base text-semibold text-gray-200 text-center">
    Today
  </span>
  <button class="flex-grow-0 text-blue-600 hover:text-blue-800">
    <ChevronRight/>
  </button>
</div>
