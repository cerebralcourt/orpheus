import { For } from "solid-js/web"
import { alpha } from "./store"

function Header({ matches }) {
  const linkClass = "block text-center px-2 py-1 text-white rounded-sm hover:bg-indigo-500"
  const active = letter => matches("/" + letter) ? " bg-indigo-700" : ""

  return (
  	<header>
      <nav class="bg-indigo-600 flex justify-center py-3">
        <ul class="flex items-center mx-auto">
          <li>
            <a href="#/" title="Home" class="block pr-4">
              <img src="assets/lyre.svg" alt="home icon" class="h-8" />
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
      </nav>
      <div class="bg-indigo-700 h-4" />
    </header>
  )
}

export default Header
