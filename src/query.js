import arlang from "arlang"
import localforage from "localforage"
import { arweave } from "./store"

async function transaction(wallet, data, tags) {
  const tx = await arweave.createTransaction({ data }, wallet)
  tx.addTag("appname", "orpheus")

  const entries = Object.entries(tags)
  for (let i = 0; i < entries.length; i++) {
    const [name, value] = entries[i]
    tx.addTag(name, value)
  }

  await arweave.transactions.sign(tx, wallet)

  const uploader = await arweave.transactions.getUploader(tx)

  while (!uploader.isComplete) {
    await uploader.uploadChunk()
    console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`)
  }

  return tx["id"]
}

async function arql(query, params) {
  const q = arlang(`& (= appname "orpheus") (${query})`, { lang: "sym", params })
  return await arweave.arql(q)
}

/*
 * Creates artist and album pages if not already available
 */
export const publish_lyrics = async (wallet, lyricItem) => {
  const artist_txids = await arql('& (= type "artist") (= name $1)', [lyricItem.artist])

  let artist
  if (artist_txids.length) {
    artist = artist_txids[0]
  } else {
    const name = lyricItem.artist
    const image = null
    const data = JSON.stringify({ name, image })

    let letter
    if (name[0].match(/^[a-zA-Z]$/)) {
      letter = name[0].toUpperCase()
    } else {
      letter = "#"
    }

    artist = await transaction(wallet, data, { type: "artist", name, letter })
  }

  const album_txids = await arql('& (= type "album") (& (= artist $1) (= title $2))', [artist, lyricItem.album])

  let album
  if (album_txids.length) {
    album = album_txids[0]
  } else {
    const title = lyricItem.album
    const year = null
    const image = null
    const data = JSON.stringify({ title, artist, year, image })
    album = await transaction(wallet, data, { type: "album", artist })
  }

  const data = JSON.stringify({ ...lyricItem, artist, album })
  await transaction(wallet, data, { type: "lyrics", artist, album })
}

/*
 * Pulls artists matching the letter from local cache
 * Checks the network for any updates and updates local cache if so
 */
export const get_artists = async (letter, update) => {
  let artists = []

  const next = async (txid) => {
    let data = await localforage.getItem(txid)

    if (!data) {
      const arData = await arweave.transactions.getData(txid, { decode: true, string: true })
      data = JSON.parse(arData)
      await localforage.setItem(txid, data)
    }
    
    artists.push({ ...data, txid })
  }

  const txids = await localforage.getItem("txids-" + letter) || []

  arql('& (= type "artist") (= letter $1)', [letter])
    .then(async arql_txids => {
      console.log(arql_txids)
      const length = artists.length

      for (let i = 0; i < arql_txids.length; i++) {
        const txid = arql_txids[i]
        if (!txids.includes(txid)) await next(txid)
      }

      if (artists.length > length) {
        artists.sort((a, b) => a.name > b.name)
        update(artists)

        const new_txids = Array.from(new Set([...txids, ...arql_txids]))
        localforage.setItem("txids-" + letter, new_txids)
      }
    })
    .catch(() => {})

  for (let i = 0; i < txids.length; i++) {
    await next(txids[i])
  }

  artists.sort((a, b) => a.name > b.name)
  update(artists)
}
