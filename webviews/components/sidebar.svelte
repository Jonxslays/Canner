<script lang="ts">

    import { onMount } from "svelte";

    let topTextInput = "";
    let formInput = "";
    let resultIndicator = "";
    let state = "";
    let hideIndicator = true;
    let isSuccess = false;
    let isFailure = false;
    let allCans: Array<string> = [];

    onMount(async () => {
        window.addEventListener("message", async (event) => {
            const message: {type: string, value: any} = event.data;
            switch (message.type) {
                case "add-can": {
                    break;
                }

                case "get-all-cans": {
                    if (!message.value) {
                        console.log("No value for all cans")
                        return;
                    }

                    allCans = message.value;
                    console.log({allCans});
                    break;
                }
            }
        });

        console.log("getting all names")
        svscode.postMessage({
            type: "get-can-names",
            value: "",
        });
    });

</script>

<style>
    h2 {
        text-align: center;
    }

    input {
        color: white;
        background-color: rgb(65, 74, 94);
    }

    textarea {
        background-color: rgb(65, 74, 94);
        height: 200px;
    }

    ::placeholder {
        color: rgb(168, 168, 168);
    }

    .smiley {
        color: green;
    }

    .indicator {
        font-weight: bold;
        text-align: center;
        border-radius: 4px;
        border-width: 1px;
        border-color: white;
    }

    .hideIndicator {
        display: none;
    }

    .success {
        color: green;
    }

    .failure {
        color: red;
    }
</style>

<h2>Welcome to Canner <span class="smiley">:)</span></h2>
<br>

<input bind:value={topTextInput} placeholder="Name..."/>
<!-- svelte-ignore missing-declaration -->
<button on:click={() => {
    state = "add-can";
    svscode.postMessage({
        type: state,
        value: topTextInput || undefined,
    });

    hideIndicator = false;
    resultIndicator = "hello";
}}>Add a new Can</button>

<!-- svelte-ignore missing-declaration -->
<button on:click={() => {
    state = "edit-can";
    svscode.postMessage({
        type: state,
        value: topTextInput || undefined,
    });
}}>Edit a Can</button>

<!-- svelte-ignore missing-declaration -->
<button on:click={() => {
    state = "del-can";
    svscode.postMessage({
        type: state,
        value: topTextInput || undefined,
    });
}}>Delete a Can</button>

<br><br>

<form on:submit|preventDefault={async () => {

}}>
    <textarea class:hideIndicator={hideIndicator} bind:value={formInput} />
</form>

<button class:hideIndicator={hideIndicator} on:click={() => {
    hideIndicator = true;
    state = "";
}}>Cancel</button>

<br><br>

<div class="indicator">
    <h3
        class:failure={isFailure}
        class:success={isSuccess}
        class:hideIndicator={hideIndicator}
    >
        {resultIndicator}
    </h3>
</div>

<ul>
    {#each allCans as can (can)}
        <li>{can}</li>
    {/each}
</ul>
