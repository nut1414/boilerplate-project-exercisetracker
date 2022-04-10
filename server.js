const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyparser = require('body-parser');

mongoose.connect(process.env.MONGO_URI , { useNewUrlParser: true })

const userSchema = new mongoose.Schema({
  username: String
});

const exerciseSchema = new mongoose.Schema({
  userid: String,
  username: String,
  description: String,
  duration: Number,
  date: Date
});

const User = mongoose.model("mUser",userSchema);
const Exercise = mongoose.model("exercise",exerciseSchema);


require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users',async (req,res) =>{
  var result = await User.find({});
  res.json(result);
})

app.use(bodyparser.urlencoded({ extended: false }));

app.post('/api/users',(req,res) =>{
  var username = req.body.username;
  try{
    var user = new User({username});
    user.save();  
  }catch(x){
    res.json({error:"unable to create new user"});
  }
  res.json(user);
});

app.post('/api/users/:id/exercises',async (req,res)=>{
  var userid = req.params.id;
  var description = req.body.description;
  var duration = req.body.duration;
  console.log(req.body.date);
  if (req.body.date) var date = new Date(req.body.date);
  else var date = new Date();

  try{
    var user = await User.findById(userid);
    var exercise = new Exercise({userid,username:user.username,description,duration,date});
    exercise.save();
    var result = {
      _id: exercise.userid,
      username: exercise.username,
      description: exercise.description,
      duration: exercise.duration,
      date: date.toDateString()
    }
  }catch(x){
    console.log(x);
    res.json({error:"unable to create an exercise"})
  }
  
  res.json(result);
});

app.get('/api/users/:id/logs',async (req,res)=>{
  var userid = req.params.id;
  var include = {description:1,duration:1,date:1,_id:0}
  var options = {}
  if(req.query.limit) options.limit = Number.parseInt(req.query.limit);
  if(req.query.from) options.$gte = new Date(req.query.from);
  if(req.query.to) options.$lte = new Date(req.query.to);
  
  try{
    var user = await User.findById(userid);
    var log = await Exercise.find({userid},include,options).lean();
    console.log(log)
    var count = log.length;
    for (var i = 0; i < count; i++){
      log[i].date = (new Date(log[i].date)).toDateString();
    }
    var result = {
      _id: userid,
      username:user.username,
      count,
      log
    };
  }catch(x){
    console.log(x);
    res.json({error:'unable to create log'});
  }
  res.json(result);
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
