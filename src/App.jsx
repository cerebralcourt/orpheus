import { createSignal, createState, onCleanup } from "solid-js"
import { Switch, Match } from "solid-js/web"
import Header from "./Header.jsx"
import Footer from "./Footer.jsx"
import Home from "./Home.jsx"
import Alpha from "./Alpha.jsx"
import SubmitLyrics from "./SubmitLyrics.jsx"
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
  const [wallet, setWallet] = createSignal(null)
  const [address, setAddress] = createSignal(null)
  
  return (
  	<div class="flex flex-col max-w-screen min-h-screen bg-indigo-200">
      <Header matches={matches} />
      <Switch>
        <For each={alpha}>
          {letter => (
            <Match when={matches("/" + letter)}>
              <Alpha letter={letter} />
            </Match>
          )}
        </For>
        <Match when={matches("/submit-lyrics")}>
          <SubmitLyrics wallet={wallet} />
        </Match>
        <Match when={true}>
          <Home />
        </Match>
      </Switch>
      <Footer wallet={wallet} setWallet={setWallet} address={address} setAddress={setAddress} />
    </div>
  )
}

export default App
