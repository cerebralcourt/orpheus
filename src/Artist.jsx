import { createSignal } from "solid-js"
import { For } from "solid-js/web"
import { get_artist } from "./query"

function Artist() {
  const [artist, setArtist] = createSignal(null)
  const txid = window.location.hash.split("/")[2]

  get_artist(txid).then(setArtist)

  return (
  	<>
  	  <Show when={artist()}>
        <img
          src={artist().image || "assets/no-image.png"}
          class="rounded-full w-48 h-48 mx-auto shadow mb-5"
        />
        <h1 class="text-2xl font-bold">{artist().name}</h1>
        <For each={artist().albums}>
          {album => (
          	<div class="md:w-1/2 lg:w-1/3 mx-auto mt-10">
          	  <div class="flex items-center justify-center mb-5">
                <img
                  src={album.image || "assets/no-image.png"}
                  class="w-32 h-32 shadow"
                />
                <div class="text-left ml-5">
                  <h2 class="text-xl font-bold">{album.title}</h2>
                  <p>{album.year || "XXXX"}</p>
                </div>
              </div>
              <For each={album.tracks}>
                {(track, i) => (
                  <a
                    href={"#/lyrics/" + track.txid}
                    class={"block w-full py-1 " + (i() % 2 == 0 ? "bg-gray-200" : "bg-gray-300")}
                  >
                    {track.title}
                  </a>
                )}
              </For>
          	</div>
          )}
        </For>
  	  </Show>
  	</>
  )
}

export default Artist
