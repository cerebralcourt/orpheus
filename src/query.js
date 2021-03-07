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

async function query(tags) {
  tags.appname = "orpheus"
  const to_obj = ([key, value]) => `{name: ${JSON.stringify(key)}, values: [${JSON.stringify(value)}]}`
  const tags_str = "[" + Object.entries(tags).map(to_obj).join(",") + "]"

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

  const edges = res.data?.data?.transactions?.edges
  let nodes = []

  for (let i = 0; i < edges.length; i++) {
    const { node } = edges[i]
    const data = await arweave.transactions.getData(node.id, { decode: true, string: true })
    nodes.push({ ...node, ...JSON.parse(data) })
  }

  return nodes
}

/*
 * Creates artist and album pages if not already available
 */
export const publish_lyrics = async (wallet, track) => {
  const artists = await query({ type: "artist", name: track.artist })

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
  }

  const albums = await query({ type: "album", artist, title: track.album })

  let album
  if (albums.length) {
    album = albums[0].id
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
  const artists = await localforage.getItem("artists-" + letter) || []

  query({ type: "artist", letter })
    .then(async query_artists => {
      const length = artists.length

      for (let i = 0; i < query_artists.length; i++) {
        const artist = query_artists[i]
        if (artists.findIndex(a => a.id === artist.id) === -1) artists.push(artist)
      }

      if (artists.length > length) {
        artists.sort((a, b) => a.name > b.name)
        update(artists)
        localforage.setItem("artists-" + letter, artists)
      }
    })
    .catch(() => {})

  artists.sort((a, b) => a.name > b.name)
  update(artists)
}

/*
 * Retrieves metadata, albums and lyrics related to the artist
 */
export const get_artist = async (artist_id) => {
  const data = await arweave.transactions.getData(artist_id, { decode: true, string: true })
  const artist = JSON.parse(data)

  const query_albums = await query({ type: "album", artist: artist_id }, ["id", "title", "year"])
  let albums = []

  for (let i = 0; i < query_albums.length; i++) {
    const album = query_albums[i]
    const tracks = await query({ type: "lyrics", album: album.id, artist: artist_id }, ["id", "title"])
    albums.push({ ...album, tracks })
  }

  albums.sort((a, b) => a.year > b.year)

  return { ...artist, albums }
}

/*
 * Retrieves track metadata and lyrics
 */
export const get_track = async (id) => {
  const track_data = await arweave.transactions.getData(id, { decode: true, string: true })
  const track = JSON.parse(track_data)

  const album_data = await arweave.transactions.getData(track.album, { decode: true, string: true })
  const album = JSON.parse(album_data).title

  const artist_data = await arweave.transactions.getData(track.artist, { decode: true, string: true })
  const { name } = JSON.parse(artist_data)
  const artist = { id: track.artist, name }

  return { ...track, artist, album }
}
