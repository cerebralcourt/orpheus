import { createSignal, onCleanup } from "solid-js"
import { Switch, Match } from "solid-js/web"
import Nav from "./Nav.jsx"
import Home from "./Home.jsx"
import Alpha from "./Alpha.jsx"
import { alpha } from "./static"

function createRouteHandler() {
  const [location, setLocation] = createSignal(window.location.hash.slice(1) || "/")
  const locationHandler = () => setLocation(window.location.hash.slice(1))
  window.addEventListener("hashchange", locationHandler)
  onCleanup(() => window.removeEventListener("hashchange", locationHandler))

  return match => match === location()
}

function App() {
  const matches = createRouteHandler()
  
  return (
  	<>
      <Nav matches={matches} />
      <Switch>
        <Match when={matches("/")}>
          <Home />
        </Match>
        <For each={alpha}>
          {letter => (
            <Match when={matches("/" + letter)}>
              <Alpha letter={letter} />
            </Match>
          )}
        </For>
      </Switch>
    </>
  )
}

export default App
