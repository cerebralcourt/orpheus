import { createEffect } from "solid-js"

function Home() {
  createEffect(() => window.location.hash = "#/")

  const onsearch = (e) => {
    if (e.keyCode === 13) {
      const term = document.getElementById("search").value
      window.location.hash = "#/search/" + encodeURI(term)
    }
  }

  return (
  	<div class="text-center flex flex-col items-center">
  	  <h1 class="text-2xl mb-4 font-bold">Welcome to Orpheus!</h1>
  	  <p class="md:w-1/2 lg:w-1/3 mb-4">
  	    An open and collaborative database of music lyrics hosted on the Arweave blockchain!
  	  </p>
      <p class="md:w-1/2 lg:w-1/3 mb-10">
        Browse, search or submit lyrics to get started!
      </p>
      <input
        id="search"
        type="text"
        class="md:w-1/2 lg:w-1/3 border border-gray-300 rounded bg-white text-gray-500 py-2 px-4 shadow"
        placeholder="Search database..."
        onkeyup={onsearch}
      />
  	</div>
  )
}

export default Home
