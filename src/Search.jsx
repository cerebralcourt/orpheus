import { createSignal } from "solid-js"
import { For } from "solid-js/web"
import { search } from "./query"

function Search() {
  const [results, setResults] = createSignal(null)
  const [artistAmount, setArtistAmount] = createSignal(1)
  const [trackAmount, setTrackAmount] = createSignal(1)
  const term = decodeURI(window.location.hash.split("/")[2])

  search(term).then(setResults)

  let timeout
  const onsearch = () => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      const term = document.getElementById("search").value
      window.location.hash = "#/search/" + encodeURI(term)
      search(term).then(setResults)
    }, 200)
  }

  return (
  	<>
      <input
        id="search"
        type="text"
        class="md:w-1/2 lg:w-1/3 mx-auto border border-gray-300 rounded bg-white text-gray-500 py-2 px-4 shadow mb-10"
        placeholder="Search database..."
        oninput={onsearch}
        value={term}
      />
  	  <Show when={results()}>
        <div class="md:w-1/2 lg:w-1/3 mx-auto mb-10">
          <h2 class="bg-indigo-500 text-white py-2">Artists</h2>
          <For each={results().artists.slice(0, Math.min(5 * artistAmount(), results().artists.length))}>
            {(artist, i) => (
              <a
                href={"#/artist/" + artist.id}
                class={"block w-full py-1 hover:text-indigo-900 " + (i() % 2 == 0 ? "bg-gray-200" : "bg-gray-300")}
              >
                {artist.name}
              </a>
            )}
          </For>
          <Show when={5 * artistAmount() < results().artists.length}>
            <button
              onclick={() => setArtistAmount(artistAmount() + 1)}
              class="w-full py-1 bg-blue-500 text-white"
            >
              Load More
            </button>
          </Show>
        </div>
        <div class="md:w-1/2 lg:w-1/3 mx-auto mb-10">
          <h2 class="bg-indigo-500 text-white py-2">Tracks</h2>
          <For each={results().tracks.slice(0, Math.min(5 * trackAmount(), results().tracks.length))}>
            {(track, i) => (
              <a
                href={"#/lyrics/" + track.id}
                class={"block w-full px-4 py-1 hover:text-indigo-900 " + (i() % 2 == 0 ? "bg-gray-200" : "bg-gray-300")}
              >
                {track.title} by {track.artist}
              </a>
            )}
          </For>
          <Show when={5 * trackAmount() < results().tracks.length}>
            <button
              onclick={() => setTrackAmount(trackAmount() + 1)}
              class="w-full py-1 bg-blue-500 text-white"
            >
              Load More
            </button>
          </Show>
        </div>
      </Show>
  	</>
  )
}

export default Search
