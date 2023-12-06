<script lang="ts">
    export let last: boolean = false
</script>

<div class="h-2 bg-slate-700 rounded w-10"></div>
<div class="shadow bg-base-200 rounded-md p-4 w-full mx-auto">
    <div class="animate-pulse flex space-x-4">
        <div class="rounded-full bg-slate-700 h-10 w-40"></div>
        <div class="flex-1 space-y-6 py-1">
            <div class="h-2 bg-slate-700 rounded"></div>
            <div class="space-y-3">
                <div class="grid grid-cols-4 gap-4">
                    <div class="h-2 bg-slate-700 rounded col-span-2"></div>
                    <div class="h-2 bg-slate-700 rounded col-span-1"></div>
                    <div class="h-2 bg-slate-700 rounded col-span-1"></div>
                </div>
            </div>
        </div>
    </div>
</div>
{#if (last)}
    <div class="h-2 bg-slate-700 rounded w-10"></div>
{/if}
