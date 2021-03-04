import { For } from "solid-js/web"
import { get_artists } from "./query"

function Artist() {
  const txid = window.location.hash.split("/")[2]

  return (
  	<>
  	  {txid}
  	</>
  )
}

export default Artist
