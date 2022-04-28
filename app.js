const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const fs = require('fs')

const client = new Client({
  puppeteer: { headless: true },
  authStrategy: new LocalAuth({
    qrCallback: qr => {
      qrcode.generate(qr, { small: true })
    },
  }),
}) //headless: false = open web whatsapp in background

client.on('qr', qr => {
  // Generate and scan this code with your phone
  console.log('QR RECEIVED', qr)
  qrcode.generate(qr, { small: true })
})
client.on('authenticated', () => {
  console.log('AUTHENTICATED')
})
client.on('ready', () => {
  console.log('Client is ready!')
})

client.on('message', msg => {
  msg.reply('Mohon maaf, saya tidak bisa membantu anda saat ini.')
})

client.initialize()
