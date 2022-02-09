<script lang="ts">

    import { onMount } from "svelte";

    let topTextInput = "";
    let formInput = "";
    let state = "";
    let hideIndicator = true;
    let allCans: string[] = [];

    function getAllCans() {
        svscode.postMessage({
            type: "get-can-names",
            value: "",
        });
    }

    onMount(async () => {
        window.addEventListener("message", async (event) => {
            const message: {type: string, value: any} = event.data;

            switch (message.type) {
                case "add-can": {
                    getAllCans();
                    hideIndicator = true;

                    topTextInput = "";
                    formInput = "";
                    state = "";
                }

                case "all-cans": {
                    if (!message.value) {
                        return;
                    }

                    allCans = message.value;
                    break;
                }
            }
        });

        getAllCans();
    });

</script>

<style>
    h2, .state {
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

    .hideIndicator {
        display: none;
    }

    .can-list {
        display: flex;
        flex-direction: column;
        width: 100%;
        justify-content: stretch;
    }

    .can-list-item {
        list-style: none;
        size: 16px;
        padding: 5px 0px;;
        border: 1px solid rgb(59, 69, 82);
        border-radius: 2px;
        width: 100%;
        margin-left: -.75rem;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .buttonz {
        display: flex;
        flex-direction: row;
    }

    .scrollable {
        height: 50%;
        overflow-y: auto;
    }

    .cancel-button, .submit-button {
        font-weight: bold;
        margin-top: 3px;
        margin-bottom: 3px;
        width: 50%;
    }

    .cancel-button {
        color:rgb(233, 95, 95);
        margin-right: 3px;
    }

    .submit-button {
        color:rgb(122, 231, 118);
        margin-left: 3px;
    }

</style>


<h2>Welcome to Canner <span class="smiley">:)</span></h2>
<br>

<!-- svelte-ignore missing-declaration -->
<button on:click={() => {
    state = "Add a can";
    hideIndicator = false;
}}>Add a Can</button>

<!-- svelte-ignore missing-declaration -->
<button on:click={() => {
    state = "Edit a can";
    svscode.postMessage({
        type: "edit-can",
        value: topTextInput,
    });

    hideIndicator = false;
}}>Edit a Can</button>

<!-- svelte-ignore missing-declaration -->
<button on:click={() => {
    state = "Delete a can";
    svscode.postMessage({
        type: "del-can",
        value: topTextInput,
    });
}}>Delete a Can</button>

<br>

<!-- svelte-ignore missing-declaration -->
<form id="main-form" class:hideIndicator={hideIndicator} on:submit|preventDefault={async (event) => {
    if (!topTextInput || !formInput) {
        svscode.postMessage({
            type: "onError",
            value: "You must enter a name, and text for the new can."
        });
        return;
    }

    switch (state) {
        case "Add a can": {
            svscode.postMessage({
                type: "add-can",
                value: formInput,
                name: topTextInput,
            });

            break;
        }
    }
}}>
    <br>
    <h2 class="state" >{state}...</h2>
    <input bind:value={topTextInput} placeholder="Can name..." />
    <textarea bind:value={formInput} placeholder="Text for this can..." />
</form>

<div class="buttonz" >
    <button class:hideIndicator={hideIndicator} class="cancel-button" on:click={() => {
        hideIndicator = true;
        state = "";
        topTextInput = "";
        formInput = "";
    }}>Cancel</button>

    <button class:hideIndicator={hideIndicator} class="submit-button" type="submit" form="main-form">Submit</button>
</div>

<br>
<div class="scrollable">
    <div class="current-cans">
        <h2>Current Cans</h2>
        <ul class="can-list">
            {#each allCans as can}
                <li class="can-list-item">{can}</li>
            {/each}
        </ul>
    </div>
</div>
