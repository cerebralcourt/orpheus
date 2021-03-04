import { publish_lyrics } from "./query"

function SubmitLyrics({ wallet }) {
  const inputClass = "w-full border border-gray-300 rounded bg-white text-gray-500 py-1 px-3 mb-5"

  const submit = (e) => {
  	e.preventDefault()

    publish_lyrics(wallet(), {
      title: document.getElementById("entry-title").value,
      artist: document.getElementById("entry-artist").value,
      album: document.getElementById("entry-album").value,
      lyrics: document.getElementById("entry-lyrics").value,
    })
      .then(txid => window.location.hash = "#/lyrics/" + txid)
  }

  return (
  	<>
  	  <h1 class="text-2xl mb-4 font-bold">Submit Lyrics</h1>
  	  <Show
        when={wallet()}
        fallback={<p>Please sign in to continue</p>}
      >
        <form class="md:w-2/3 lg:w-1/2 bg-indigo-100 p-5 rounded mx-auto shadow" onsubmit={submit}>
          <label for="entry-title" class="block mb-2 font-bold">Song Title</label>
          <input id="entry-title" type="text" class={inputClass} required />
          <label for="entry-artist" class="block mb-2 font-bold">Artist</label>
          <input id="entry-artist" type="text" class={inputClass} required />
          <label for="entry-album" class="block mb-2 font-bold">Album</label>
          <input id="entry-album" type="text" class={inputClass} required />
          <label for="entry-lyrics" class="block mb-2 font-bold">Lyrics</label>
          <textarea id="entry-lyrics" class={inputClass} rows="15" required />
          <input
            type="submit"
            value="Submit Lyrics"
            class="bg-indigo-600 hover:bg-indigo-500 focus:bg-indigo-500 rounded px-5 py-2 text-white cursor-pointer"
          />
        </form>
      </Show>
  	</>
  )
}

export default SubmitLyrics
