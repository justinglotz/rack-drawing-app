import "dotenv/config"
import app from "./app.js"
import { prisma } from "./config/prisma.js"

const PORT = process.env.PORT || 8000

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Kill the existing process and retry.`)
  } else {
    console.error('Server error:', err)
  }
  process.exit(1)
})
