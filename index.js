const express = require('express')
const knex = require('knex')
const bcrypt = require('bcrypt')
const yup = require('yup')
const jwt = require('jsonwebtoken');
const fs = require('fs')

const port = 3000
const saltRounds = 10

const algorithm = 'RS256'
const privateKey = fs.readFileSync('./jwtRS256.key')
const publicKey = fs.readFileSync('./jwtRS256.key.pub')

const knexInstance = knex({
  client: 'mysql2',
  connection: {
    host: 'mysqldb',
    port: 3306,
    user: process.env.MYSQLDB_USER,
    password: process.env.MYSQLDB_ROOT_PASSWORD,
    database: process.env.MYSQLDB_DATABASE
  }
});

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.json(req.headers)
})

const loginSchema = yup.object({
  username: yup.string().required().min(5),
  password: yup.string().required().min(8).max(72),
}).noUnknown()

app.post('/login', (req, res) => {
  loginSchema.validate(req.body)
    .catch(err => res.status(422).send(err.errors))
    .then(login)
    .then(({ status, data }) => res.status(status).send(data))
    .catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
})

async function login(request) {
  const [user] = await knexInstance
    .select()
    .from('users')
    .where({ username: request.username })
  if (!user || user.length === 0) return { status: 401, data: { message: "Wrong Username Or Password" } }
  const passwordMatch = await bcrypt.compare(request.password, user.password)
  if (!passwordMatch) return { status: 401, data: { message: "Wrong Username Or Password" } }
  // gerar token
  const token = jwt.sign({ subject: user.username, iss: 'JATI-2023', email: user.email }, privateKey, { algorithm })
  return { status: 200, data: { token } }
}

const registerSchema = yup.object({
  email: yup.string().required().email(),
  username: yup.string().required().min(5),
  password: yup.string().required().min(8).max(72),
}).noUnknown()

app.post('/register', (req, res) => {
  registerSchema.validate(req.body)
    .catch(err => res.status(422).send(err.errors))
    .then(register)
    .then(user => res.status(200).send(user))
    .catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
})

async function register(request) {
  const passwordHash = await bcrypt.hash(request.password, saltRounds)
  const [userId] = await knexInstance('users')
    .insert({
      username: request.username,
      email: request.email,
      password: passwordHash,
    })
  const user = await knexInstance
    .select('id', 'username', 'email')
    .from('users')
    .where({ id: userId })
  return user
}

app.get('/profile', (req, res) => {
  profile(req.header('authorization'))
    .then(({ status, data }) => res.status(status).send(data))
    .catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
})

async function profile(authHeader) {
  if (!authHeader || authHeader.length == 0) return { status: 401, data: { message: 'Unauthenticated' } }
  const [_, token] = authHeader.split(' ')
  if (!token || token.length === 0) return { status: 401, data: { message: 'Unauthenticated' } }
  const claims = jwt.verify(token, publicKey, { issuer: 'JATI-2023' })
  const [user] = await knexInstance
    .select(['id', 'username', 'email'])
    .from('users')
    .where({ username: claims.subject })
  return { status: 200, data: { user, claims } }
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
