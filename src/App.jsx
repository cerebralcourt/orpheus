import { createSignal, createState, onCleanup } from "solid-js"
import { Switch, Match } from "solid-js/web"
import Header from "./Header.jsx"
import Footer from "./Footer.jsx"
import Home from "./Home.jsx"
import Alpha from "./Alpha.jsx"
import Artist from "./Artist.jsx"
import Lyrics from "./Lyrics.jsx"
import SubmitLyrics from "./SubmitLyrics.jsx"
import { alpha, arweave } from "./store"
import * as query from "./query"

function createRouteHandler() {
  const [location, setLocation] = createSignal(window.location.hash.slice(1) || "/")
  const locationHandler = () => setLocation(window.location.hash.slice(1))
  window.addEventListener("hashchange", locationHandler)
  onCleanup(() => window.removeEventListener("hashchange", locationHandler))

  const matches = match => match === location()
  const startsWith = match => location().startsWith(match)
  return [matches, startsWith]
}

function App() {
  const [matches, startsWith] = createRouteHandler()
  const [wallet, setWallet] = createSignal(sessionStorage.getItem("wallet") ? JSON.parse(sessionStorage.getItem("wallet")) : null)
  const [address, setAddress] = createSignal(sessionStorage.getItem("address"))
  
  return (
  	<div class="flex flex-col max-w-screen min-h-screen bg-indigo-200">
      <Header matches={matches} />
      <main class="flex-grow px-4 py-10 text-center">
        <Switch>
          <Match when={startsWith("/lyrics/")}>
            <Lyrics />
          </Match>
          <Match when={startsWith("/artist/")}>
            <Artist />
          </Match>
          <Match when={matches("/submit-lyrics")}>
            <SubmitLyrics wallet={wallet} />
          </Match>
          <For each={alpha}>
            {letter => (
              <Match when={matches("/" + letter)}>
                <Alpha letter={letter} />
              </Match>
            )}
          </For>
          <Match when={true}>
            <Home />
          </Match>
        </Switch>
      </main>
      <Footer wallet={wallet} setWallet={setWallet} address={address} setAddress={setAddress} />
    </div>
  )
}

export default App
