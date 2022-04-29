import wa from 'whatsapp-web.js'
import express, { json, urlencoded } from 'express'
import { Server } from 'socket.io'
import { toDataURL } from 'qrcode'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const { Client, LocalAuth } = wa
const app = express()
const httpServer = app.listen(8000, () => {
  console.log('Server is running on port 8000')
})
const io = new Server(httpServer)

app.use(json())
app.use(urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const client = new Client({
  puppeteer: { headless: true },
  authStrategy: new LocalAuth()
}) //headless: false = open web whatsapp in background

client.on('message', async msg => {
  if (msg.body.startsWith('!sendto ')) {
    // Direct send a new message to specific id
    let number = msg.body.split(' ')[1]
    let messageIndex = msg.body.indexOf(number) + number.length
    let message = msg.body.slice(messageIndex, msg.body.length)
    number = number.includes('@c.us') ? number : `${number}@c.us`
    let chat = await msg.getChat()
    chat.sendSeen()
    client.sendMessage(number, message)
  } else if (msg.body === '!chats') {
    const chats = await client.getChats()
    client.sendMessage(msg.from, `The bot has ${chats.length} chats open.`)
  }
  if (msg.body === '!info') {
    let info = client.info
    client.sendMessage(
      msg.from,
      `
        *Connection info*
        User name: ${info.pushname}
        My number: ${info.wid.user}
        Platform: ${info.platform}
    `
    )
  } else {
    msg.reply('Tong Ganggu, Gandeng!.')
  }
})
client.on('change_state', state => {
  console.log('CHANGE STATE', state)
})
client.initialize()

//socket.io
io.on('connection', socket => {
  socket.emit('message', 'Connecting...')
  client.on('qr', qr => {
    console.log('QR RECEIVED', qr)
    toDataURL(qr, (err, url) => {
      if (err) throw err
      socket.emit('qr', url)
      socket.emit('message', 'Scan QR code di whatsapp')
    })
  })
  client.on('ready', () => {
    socket.emit('ready', 'Ready')
    socket.emit('message', 'WhatsApp API ready')
  })

  client.on('authenticated', () => {
    socket.emit('authenticated', 'WhatsApp API is Authenticated')
    socket.emit('message', 'WhatsApp API is Authenticated')
  })
  client.on('message', msg => {
    socket.emit('message', msg)
  })
})
app.post('/send', (req, res) => {
  const number = req.body.number
  const message = req.body.message
  client
    .sendMessage(number, message)
    .then(response => {
      res.status(200).json({
        status: true,
        response
      })
    })
    .catch(err => {
      res.status(500).json({
        status: false,
        response: err
      })
    })
})
httpServer
