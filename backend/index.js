const express = require("express")
const app = express();
const db = require('./models/index')
const Student = db.Student;
const bodyParser = require("body-parser") 
const jwt = require("jsonwebtoken")
const path = require("path")
const bcrypt = require("bcrypt")
const multer = require("multer")
const {studSchema} = require("./controller/joivalidation")

const {profilePictureupdate,jwtverify,updatedata,uploadProfilePicture,updateAll,verifyemailsubfunction,createStudent,getOneStudent,getStudent, sendmail,resetPass,forgotPass,updateMobile,updateEmail,resetPassword,login,deleteStudent,updateNresetpassword,updateProfile } = require("./controller/studentcontroller");
const { where } = require("sequelize");

require("./models/index") 

app.use(bodyParser.json())
app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.post('/updateNresetpassword',updateNresetpassword)
app.post('/updateMobile',updateMobile)
app.post("/updateEmail",updateEmail)
app.post('/createStudent', createStudent);
app.post('/updateProfile',updateProfile)
app.post('/login',login)
app.post('/resetPass',resetPass)
app.post("/forgotPass",forgotPass)
app.get('/getStudent',getStudent)
app.get('/getOneStudent/:id',getOneStudent)
app.get('/sendmail/:id',sendmail)
app.get('/verify/:id', verifyemailsubfunction);
app.get('/resetpassword/:id',resetPassword)
app.delete('/deleteStudent/:id',deleteStudent)
app.post('/updateAll',uploadProfilePicture,updateAll)

app.patch('/updatedata/:id',jwtverify,profilePictureupdate,updatedata)
  
app.listen(7711)