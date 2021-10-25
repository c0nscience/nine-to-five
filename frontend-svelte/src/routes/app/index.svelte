<script context="module">
  import dayjs from "dayjs";

  /**
   * @type {import('@sveltejs/kit').Load}
   */
  export async function load() {
    const now = dayjs()
    return {
      redirect: `/app/${now.format('YYYY-MM-DD')}`,
      status: 302
    };
  }
</script>
