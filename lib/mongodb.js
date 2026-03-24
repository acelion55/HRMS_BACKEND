import { MongoClient } from "mongodb"
import dotenv from "dotenv"

dotenv.config()

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error("MONGODB_URI is not set in .env")
}

const dbName = process.env.MONGODB_DB_NAME || "hrms"

let cached = globalThis._mongoClientCache
if (!cached) {
  cached = globalThis._mongoClientCache = { client: null, db: null }
}

export async function connectToDatabase() {
  if (cached.client && cached.db) {
    return { client: cached.client, db: cached.db }
  }

  const client = new MongoClient(uri, { serverApi: { version: "1" } })
  await client.connect()

  const db = client.db(dbName)
  cached.client = client
  cached.db = db

  return { client, db }
}
