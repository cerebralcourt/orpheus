import { createSignal } from "solid-js"
import { arweave } from "./store"

function getWalletFromFile(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = reader.result
        const wallet = JSON.parse(data)
        arweave.wallets.jwkToAddress(wallet).then(address => res({wallet, address}))
      } catch(error) {
        alert(error.toString())
        reject(error)
      }
    }
    reader.readAsText(file)
  })
}

function Footer({ wallet, setWallet, address, setAddress }) {
  const linkClass = "block px-3 py-2 mx-2 bg-indigo-600 hover:bg-indigo-500"

  const triggerUpload = () => {
  	const upload = document.getElementById("upload")
  	upload.click()
  	const oninput = async () => {
  	  const file = upload.files[0]
  	  const { wallet, address } = await getWalletFromFile(file)
  	  setWallet(wallet)
      setAddress(address)
      sessionStorage.setItem("wallet", JSON.stringify(wallet))
      sessionStorage.setItem("address", address)
  	  upload.removeEventListener("input", oninput)
  	}
  	upload.addEventListener("input", oninput)
  }

  const signout = () => {
    setWallet(null)
    setAddress(null)
    sessionStorage.removeItem("wallet")
    sessionStorage.removeItem("address")
  }

  return (
  	<footer class="bg-indigo-700 flex justify-center">
  	  <ul class="flex text-white">
        <li>
          <a href="https://github.com/cerebralcourt/orpheus" class={linkClass}>
          	Open Source
          </a>
        </li>
        <li>
          <a href="https://faucet.arweave.net/" class={linkClass}>
          	Create Wallet
          </a>
        </li>
        <li>
          <a href="#/submit-lyrics" class={linkClass}>
          	Submit Lyrics
          </a>
        </li>
        <Show
        	when={wallet()}
        	fallback={
        	  <li>
	            <input id="upload" class="hidden" type="file" accept=".json" />
	            <button onclick={triggerUpload} class={linkClass}>
	          	  Sign In
	            </button>
	          </li>
        	}
        >
        	<li>
	          <button onclick={signout} class={linkClass}>
	          	Sign Out
	          </button>
	        </li>
        </Show>
  	  </ul>
  	</footer>
  )
}

export default Footer

