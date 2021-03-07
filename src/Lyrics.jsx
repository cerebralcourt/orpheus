import { createSignal } from "solid-js"
import { For } from "solid-js/web"
import { get_track } from "./query"

function Lyrics() {
  const [track, setTrack] = createSignal(null)
  const id = window.location.hash.split("/")[2]

  get_track(id).then(setTrack)

  return (
  	<>
  	  <Show when={track()}>
        <img
          src={track().image || "assets/no-image.png"}
          class="rounded-full w-48 h-48 mx-auto shadow mb-5"
        />
        <h1 class="text-2xl font-bold">{track().title}</h1>
        <a href={"#/artist/" + track().artist.id} class="block">{track().artist.name}</a>
        <p class="mb-10">{track().album}</p>
        <For each={track().lyrics}>
          {paragraph => (
            <div class="md:w-1/2 lg:w-1/3 mt-4 mx-auto">
              <For each={paragraph}>
                {line => <p>{line}</p>}
              </For>
            </div>
          )}
        </For>
  	  </Show>
  	</>
  )
}

export default Lyrics
