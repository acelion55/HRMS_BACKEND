import express from "express"
import { connectToDatabase } from "../lib/mongodb.js"

const router = express.Router()
const AUDIT_COLLECTION = "auditLogs"

router.get("/", async (req, res) => {
  try {
    const { db } = await connectToDatabase()
    const docs = await db.collection(AUDIT_COLLECTION).find({}).sort({ timestamp: -1 }).toArray()
    const data = docs.map((doc) => ({ ...doc, id: doc._id.toString(), _id: undefined }))
    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Unable to fetch audit logs" })
  }
})

router.post("/", async (req, res) => {
  const body = req.body
  try {
    const { db } = await connectToDatabase()
    const log = {
      userId: String(body.userId || ""),
      userName: String(body.userName || ""),
      userRole: String(body.userRole || ""),
      actionType: String(body.actionType || "TICKET_VIEWED"),
      ticketId: body.ticketId ?? null,
      ticketTitle: body.ticketTitle ?? null,
      oldValue: body.oldValue ?? null,
      newValue: body.newValue ?? null,
      timestamp: String(body.timestamp || new Date().toISOString()),
      ipAddress: String(body.ipAddress || "")
    }
    const result = await db.collection(AUDIT_COLLECTION).insertOne(log)
    res.status(201).json({ ...log, id: result.insertedId.toString() })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Unable to save audit log" })
  }
})

export default router
