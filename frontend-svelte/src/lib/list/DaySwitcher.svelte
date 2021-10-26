<script>
  import ChevronRight from '$lib/icons/ChevronRight.svelte'
  import ChevronLeft from '$lib/icons/ChevronLeft.svelte'
  import dayjs from 'dayjs'
  import Popper from '@popperjs/svelte'
  import {DatePicker} from "date-picker-svelte";
  import {goto} from "$app/navigation";
  import './popover.css'

  export let date
  $: _date = dayjs(date)

  const css = obj =>
    Object.entries(obj || {})
      .map(x => x.join(":"))
      .join(";");

  let showPopover = false

  function onChange(d) {
    goto(`/app/${dayjs(d).format('YYYY-MM-DD')}`)
    showPopover = false
  }

  let jsDate = dayjs(date).toDate()
  $: onChange(jsDate)

  let popoverAnchor
  let popoverElement
  let arrowElement

  $: popperOptions = {
    modifiers: [
      {name: "offset", options: {offset: [0, 5]}},
      {name: "arrow", options: {element: arrowElement}}
    ]
  };
  let styles = {};
  let attributes = {};

</script>

<div class="flex items-center mt-2 mb-2">
  <a class="flex-grow-0 primary-interaction"
     href="/app/{_date.subtract(1, 'day').format('YYYY-MM-DD')}">
    <ChevronLeft/>
  </a>
  <Popper
    reference={popoverAnchor}
    popper={popoverElement}
    options={popperOptions}
    bind:styles
    bind:attributes>
    <button class="flex-grow text-base text-semibold text-center primary-interaction"
            bind:this={popoverAnchor}
            on:click={() => {
              showPopover = !showPopover;
          }}>
      {_date.format('dd. MMM D, YYYY')}
    </button>
    <div
      bind:this={popoverElement}
      class="tooltip {showPopover ? 'visible' : 'invisible'}"
      style={css(styles.popper)}
      {...attributes.popper}>
      <DatePicker bind:value={jsDate} />
      <div bind:this={arrowElement} class="arrow" style={css(styles.arrow)}/>
    </div>
  </Popper>
  <a class="flex-grow-0 primary-interaction"
     href="/app/{_date.add(1, 'day').format('YYYY-MM-DD')}">
    <ChevronRight/>
  </a>
</div>
