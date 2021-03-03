import { For } from "solid-js/web"
import { alpha } from "./store"

function Nav({ matches }) {
  const linkClass = "block text-center px-2 py-1 text-white rounded-sm hover:bg-blue-700"
  const active = letter => matches("/" + letter) ? " bg-blue-700" : ""

  return (
  	<nav class="bg-blue-600">
  	  <ul class="flex items-center">
        <li>
          <a href="#/" title="Home" class="block p-3">
            <img src="assets/lyre.svg" alt="home icon" class="w-8" />
          </a>
        </li>
        <For each={alpha}>
          {letter => (
            <li>
              <a href={"#/" + letter} class={linkClass + active(letter)}>
                {letter}
              </a>
            </li>
          )}
        </For>
  	  </ul>
      {/*<button>
        <img src="assets/search.svg" alt="search icon" />
      </button>*/}
  	</nav>
  )
}

export default Nav
