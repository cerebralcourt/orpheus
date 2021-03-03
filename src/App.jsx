import { createSignal, onCleanup } from "solid-js"
import { Switch, Match } from "solid-js/web"
import Header from "./Header.jsx"
import Home from "./Home.jsx"
import Alpha from "./Alpha.jsx"
import { alpha, arweave } from "./store"

arweave.network.getInfo().then(console.log)

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
      <Header matches={matches} />
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
