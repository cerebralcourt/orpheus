import { createEffect } from "solid-js"

function Home() {
  createEffect(() => window.location.hash = "#/")

  return (
  	<div class="text-center flex flex-col items-center">
  	  <h1 class="text-2xl mb-4 font-bold">Welcome to Orpheus!</h1>
  	  <p class="md:w-1/2 lg:w-1/3 mb-4">
  	    An open and collaborative database of music lyrics hosted on the Arweave blockchain!
  	  </p>
      <p class="md:w-1/2 lg:w-1/3 mb-10">
        Browse, search or submit lyrics to get started!
      </p>
      <div class="md:w-1/2 lg:w-1/3 flex">
        <input
          type="text"
          class="flex-grow border border-gray-300 rounded bg-white text-gray-500 py-2 px-4 shadow"
          placeholder="Search database..."
        />
      </div>
  	</div>
  )
}

export default Home
