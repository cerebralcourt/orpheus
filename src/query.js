import arlang from "arlang"
import { arweave } from "./store"

async function transaction(wallet, data, tags) {
  const transaction = await arweave.createTransaction({ data }, wallet)
  transaction.addTag("App-Name", "orpheus")

  const entries = Object.entries(tags)
  for (let i = 0; i < entries.length; i++) {
    const [name, value] = entries[i]
    transaction.addTag(name, value)
  }

  await arweave.transactions.sign(transaction, wallet)

  const uploader = await arweave.transactions.getUploader(transaction)

  while (!uploader.isComplete) {
    await uploader.uploadChunk()
    console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`)
  }
}

export const lyrics = {
  all: async (wallet) => {
  	const query = arlang('& (= App-Name "orpheus") (= type "lyrics")', { lang: "sym" })
  	return await arweave.arql(query)
  },
  post: async (wallet, lyricItem) => {
  	const data = JSON.stringify(lyricItem)
  	await transaction(wallet, data, { type: "lyrics" })
  },
}
