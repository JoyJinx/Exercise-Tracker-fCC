const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongo = require("mongodb")
const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI).then(()=>console.log("Connected to database...")).catch((e)=>console.log(e))

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const exerciseSchema = mongoose.Schema({
  username: String,
  userId: String,
  description: String,
  duration: Number,
  date: String,
})
const userSchema = mongoose.Schema({
  username: String
})
const Exercise = mongoose.model("Exercise", exerciseSchema)
const User = mongoose.model("User", userSchema)

app.get("/api/users/deleteall", async function(req, res){
  await User.deleteMany({})
    res.json({message:"all users have been deleted!"})
  })

app.get('/api/exercises/deleteall',async function (req, res) {
	await Exercise.deleteMany({})
		res.json({ message: 'all exercises have been deleted!'});
	});

app.get('/api/users', async function(req, res){
  const usersList = await User.find();
  if(usersList.length === 0){
    res.json({message:"no users in database"});
  }else{
  res.json(usersList)
  }
})
app.post('/api/users',async function(req, res){
  const {username} = req.body;
  const newUser = new User({username: username})
  await newUser.save()
  res.json({username: newUser.username, _id: newUser._id})
})
app.post('/api/users/:_id/exercises',async function(req, res){
  const {_id} = req.params;
  const foundUser = await User.findById(_id);
  const {description ,duration ,date} = req.body;
  const newDate = new Date().toISOString().substring(0,10)
  const newExercise = new Exercise({username: foundUser.username, userId:_id, description: description, duration: duration, date: date||newDate})
  await newExercise.save()
  res.json({username: foundUser.username, description: newExercise.description, duration: newExercise.duration, date:new Date(date).toDateString()||newDate, _id:_id})
})
app.get('/api/users/:_id/logs', async function(req, res){
  const {_id} = req.params;
  const from = req.query.from || new Date(0).toISOString().substring(0, 10);
	const to = req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
	const limit = Number(req.query.limit) || 0;
  const foundUser = await User.findById(_id);
  if(foundUser){
    const foundExercises = await Exercise.find({userId:_id, date:{$gte: from, $lte: to}}).limit(limit).exec()
    const logFormat = foundExercises.map((exercise) => {
		return {
			description: exercise.description,
			duration: exercise.duration,
			date: new Date(exercise.date).toDateString(),
		};
	});

    if(foundExercises.length===0){
      res.json({message: "this user has no exercises!"})
    }else{
      res.json({username:foundUser.username, count: parseInt(foundExercises.length),_id:foundUser['_id'],log:logFormat})
    }
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
