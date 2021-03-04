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
export const publish_lyrics = async (wallet, track) => {
  const artist_txids = await arql('& (= type "artist") (= name $1)', [track.artist])

  let artist
  if (artist_txids.length) {
    artist = artist_txids[0]
  } else {
    const name = track.artist
    const data = JSON.stringify({ name })

    let letter
    if (name.toLowerCase().startsWith("the ")) {
      letter = name[4].toUpperCase()
    } else if (name[0].match(/^[a-zA-Z]$/)) {
      letter = name[0].toUpperCase()
    } else {
      letter = "#"
    }

    artist = await transaction(wallet, data, { type: "artist", name, letter })
  }

  const album_txids = await arql('& (= type "album") (& (= artist $1) (= title $2))', [artist, track.album])

  let album
  if (album_txids.length) {
    album = album_txids[0]
  } else {
    const title = track.album
    const year = null
    const image = null
    const data = JSON.stringify({ title, artist })
    album = await transaction(wallet, data, { type: "album", title, artist })
  }

  const lyrics = track.lyrics.split(/\n\n+/).map(p => p.split("\n"))

  const data = JSON.stringify({ ...track, artist, album, lyrics })
  return await transaction(wallet, data, { type: "lyrics", artist, album })
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

/*
 * Retrieves metadata, albums and lyrics related to the artist
 */
export const get_artist = async (artist_txid) => {
  const data = await arweave.transactions.getData(artist_txid, { decode: true, string: true })
  const artist = JSON.parse(data)

  const album_txids = await arql('& (= type "album") (= artist $1)', [artist_txid])
  let albums = []

  for (let i = 0; i < album_txids.length; i++) {
    const album_txid = album_txids[i]
    const data = await arweave.transactions.getData(album_txid, { decode: true, string: true })
    const album = JSON.parse(data)

    const track_txids = await arql('& (= type "lyrics") (& (= album $1) (= artist $2))', [album_txid, artist_txid])
    let tracks = []

    for (let j = 0; j < track_txids.length; j++) {
      const txid = track_txids[j]
      const data = await arweave.transactions.getData(txid, { decode: true, string: true })
      const track = { ...JSON.parse(data), txid }
      tracks.push(track)
    }

    albums.push({ ...album, tracks })
  }

  albums.sort((a, b) => a.year > b.year)

  return { ...artist, albums }
}

/*
 * Retrieves track metadata and lyrics
 */
export const get_track = async (txid) => {
  const track_data = await arweave.transactions.getData(txid, { decode: true, string: true })
  const track = JSON.parse(track_data)

  const album_data = await arweave.transactions.getData(track.album, { decode: true, string: true })
  const album = JSON.parse(album_data).title

  const artist_data = await arweave.transactions.getData(track.artist, { decode: true, string: true })
  const { name } = JSON.parse(artist_data)
  const artist = { txid: track.artist, name }

  return { ...track, artist, album }
}
