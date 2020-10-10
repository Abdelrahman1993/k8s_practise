const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

const mysql = require('mysql2');


app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup


var con = mysql.createConnection({
  host: keys.mysqlHost,
  user: keys.mysqlUser,
  password: keys.mysqlPassword,
  database: keys.mysqlDatabase
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var sql = "CREATE TABLE if not exists valuess (number INT(6));";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });
});


 //('CREATE TABLE IF NOT EXISTS values (number INT)')


// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/', (req, res) => {
  res.send('Hi');
});

app.get('/values/all',  (req, res) => {
con.query('SELECT * from valuess',function (err, result) {
    if (err) throw err;
    res.send(result);
  });

 
});

app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);
  
  var sql = `INSERT INTO valuess (number) VALUES (${index})`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });

  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Start Listening on port 5000');
});