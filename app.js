const { Client, LocalAuth } = require('whatsapp-web.js')
const express = require('express')
const socketIo = require('socket.io')
const qrcode = require('qrcode')
const http = require('http')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const client = new Client({
  puppeteer: { headless: true },
  authStrategy: new LocalAuth(),
}) //headless: false = open web whatsapp in background

client.on('message', msg => {
  msg.reply('Mohon maaf, saya tidak bisa membantu anda saat ini.')
})

client.initialize()

//socket.io
io.on('connection', socket => {
  socket.emit('message', 'Connecting...')
  client.on('qr', qr => {
    console.log('QR RECEIVED', qr)
    qrcode.toDataURL(qr, (err, url) => {
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
})

app.post('/send', (req, res) => {
  const number = req.body.number
  const message = req.body.message
  client
    .sendMessage(number, message)
    .then(response => {
      res.status(200).json({
        status: true,
        response,
      })
    })
    .catch(err => {
      res.status(500).json({
        status: false,
        response: err,
      })
    })
})
server.listen(8000, () => {
  console.log('Server is running on port 8000')
})
