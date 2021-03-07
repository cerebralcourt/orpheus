import { createSignal } from "solid-js"
import { For } from "solid-js/web"
import { get_artists } from "./query"

function Alpha({ letter }) {
  const [artists, setArtists] = createSignal([])

  get_artists(letter, setArtists)

  return (
  	<>
  	  <div class="md:w-2/3 lg:w-1/2 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-x-3 gap-y-1">
  	  	<For each={artists()}>
          {artist => (
            <a
              href={"#/artist/" + artist.id}
              class="block text-center py-1 text-blue-900 bg-indigo-300 border-b border-indigo-400"
            >
          	  {artist.name}
            </a>
          )}
  	    </For>
  	  </div>
  	</>
  )
}

export default Alpha
