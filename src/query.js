import localforage from "localforage"
import levenshtein from "js-levenshtein"
import pmap from "promise.map"
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
  }

  return tx["id"]
}

async function get_data(id) {
  const fetch_data = async (id) => {
    const raw_data = await arweave.transactions.getData(id, { decode: true, string: true })
    const data = JSON.parse(raw_data)
    localforage.setItem(id, data)
    return data
  }
  return await localforage.getItem(id) || await fetch_data(id)
}

async function query(tags) {
  const key = JSON.stringify(tags)

  const fetch_ids = async () => {
    const to_obj = ([key, value]) => `{name: ${JSON.stringify(key)}, values: ${JSON.stringify(value)}}`
    const tags_str = "[" + Object.entries({ ...tags, appname: "orpheus" }).map(to_obj).join(",") + "]"

    const query = `query {
      transactions(tags: ${tags_str}) {
        edges {
          node {
            id
          }
        }
      }
    }`

    const res = await arweave.api.post("/graphql", { query })
    const ids = res.data?.data?.transactions?.edges?.map(({ node }) => node.id)
    localforage.setItem(key, ids)
    return ids
  }

  const ids = await localforage.getItem(key) || await fetch_ids()
  let nodes = []
  let promises = []

  for (let i = 0; i < ids.length; i++) {
    promises.push(async () => {
      const id = ids[i]
      const data = await get_data(id)
      nodes.push({ id, ...data })
    })
  }

  await pmap(promises, p => p(), 30)

  return nodes
}

/*
 * Creates artist and album pages if not already available
 */
export const publish_lyrics = async (wallet, track) => {
  const artists = await query({ type: ["artist"], name: [track.artist] })

  let artist
  if (artists.length) {
    artist = artists[0].id
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
    localforage.setItem(artist, data)
  }

  const albums = await query({ type: ["album"], artist: [artist], title: [track.album] })

  let album
  if (albums.length) {
    album = albums[0].id
  } else {
    const title = track.album
    const year = null
    const image = null
    const data = JSON.stringify({ title, artist })
    album = await transaction(wallet, data, { type: "album", title, artist })
    localforage.setItem(album, data)
  }

  const lyrics = track.lyrics.split(/\n\n+/).map(p => p.split("\n"))

  const data = JSON.stringify({ ...track, artist, album, lyrics })
  const id = await transaction(wallet, data, { type: "lyrics", artist, album })
  localforage.setItem(id, data)
  return id
}

/*
 * Pulls artists matching the letter from local cache
 * Checks the network for any updates and updates local cache if so
 */
export const get_artists = async (letter, update) => {
  const artists = await query({ type: ["artist"], letter: [letter] })
  artists.sort((a, b) => a.name > b.name)
  update(artists)
}

/*
 * Retrieves metadata, albums and lyrics related to the artist
 */
export const get_artist = async (artist_id) => {
  const artist = await get_data(artist_id)

  const query_albums = await query({ type: ["album"], artist: [artist_id] })
  let albums = []

  for (let i = 0; i < query_albums.length; i++) {
    const album = query_albums[i]
    const tracks = await query({ type: ["lyrics"], album: [album.id], artist: [artist_id] })
    albums.push({ ...album, tracks })
  }

  albums.sort((a, b) => a.year > b.year)

  return { ...artist, albums }
}

/*
 * Retrieves track metadata and lyrics
 */
export const get_track = async (id) => {
  const track = await get_data(id)
  const album = await get_data(track.album).title

  const { name } = await get_data(track.artist)
  const artist = { id: track.artist, name }

  return { ...track, artist, album }
}

/*
 * Search engine
 */

export const search = async (term) => {
  let artists, albums, tracks
  let promises = []

  promises.push(async () => {
    artists = (await query({ type: ["artist"] }))
      .map(a => ({ ...a, dist: levenshtein(a.name, term) }))
      .sort((a, b) => a.dist - b.dist)
  })

  promises.push(async () => {
    albums = (await query({ type: ["album"] }))
      .map(a => ({ ...a, dist: levenshtein(a.title, term) }))
      .sort((a, b) => a.dist - b.dist)
  })

  promises.push(async () => {
    tracks = await query({ type: ["lyrics"] })

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      const dist = levenshtein(track.title, term)
      const artist = (await get_data(track.artist)).name
      tracks[i] = { ...track, dist, artist }
    }

    tracks.sort((a, b) => a.dist - b.dist)
  })

  await pmap(promises, p => p(), 3)

  return { artists, albums, tracks }
}
