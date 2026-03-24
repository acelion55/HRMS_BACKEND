import express from "express"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "../lib/mongodb.js"

const router = express.Router()

const TICKET_COLLECTION = "tickets"

router.get("/", async (req, res) => {
  try {
    const { db } = await connectToDatabase()
    const docs = await db.collection(TICKET_COLLECTION).find({}).sort({ createdAt: -1 }).toArray()
    const data = docs.map((doc) => ({ ...doc, id: doc._id.toString(), _id: undefined }))
    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Unable to fetch tickets" })
  }
})

router.post("/", async (req, res) => {
  const body = req.body
  try {
    const { db } = await connectToDatabase()
    const ticket = {
      title: String(body.title || ""),
      description: String(body.description || ""),
      category: String(body.category || "GENERAL"),
      priority: String(body.priority || "MEDIUM"),
      status: String(body.status || "OPEN"),
      department: String(body.department || "ENGINEERING"),
      location: String(body.location || ""),
      projectName: String(body.projectName || "General"),
      ticketType: String(body.ticketType || "SERVICE_REQUEST"),
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      creatorId: String(body.creatorId || ""),
      creatorName: String(body.creatorName || ""),
      assigneeId: body.assigneeId || null,
      assigneeName: body.assigneeName || null,
      comments: Array.isArray(body.comments) ? body.comments : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    }
    const result = await db.collection(TICKET_COLLECTION).insertOne(ticket)
    res.status(201).json({ ...ticket, id: result.insertedId.toString() })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Unable to create ticket" })
  }
})

router.patch("/:id", async (req, res) => {
  const id = req.params.id
  if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ticket id" })

  const body = req.body

  const update = { updatedAt: new Date().toISOString() }
  if (body.status) update.status = String(body.status)
  if (body.assigneeId !== undefined) update.assigneeId = body.assigneeId
  if (body.assigneeName !== undefined) update.assigneeName = body.assigneeName
  if (body.deletedAt !== undefined) update.deletedAt = body.deletedAt

  try {
    const { db } = await connectToDatabase()

    if (body.comment && typeof body.comment === "object") {
      await db.collection(TICKET_COLLECTION).updateOne({ _id: new ObjectId(id) }, { $push: { comments: body.comment } })
    }

    await db.collection(TICKET_COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: update })

    const ticket = await db.collection(TICKET_COLLECTION).findOne({ _id: new ObjectId(id) })
    if (!ticket) return res.status(404).json({ message: "Ticket not found" })

    res.json({ ...ticket, id: ticket._id.toString(), _id: undefined })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Unable to update ticket" })
  }
})

export default router
