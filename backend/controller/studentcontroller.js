const db = require("../models/index");
const sendmail = require("./studentcontroller");
const Student = db.Student;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require("path");
const { where } = require("sequelize");
const { studSchema } = require("./joivalidation");
const fs = require("fs");
const { Console } = require("console");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    let ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

exports.sendmail = async (req, res) => {
  try {
    const pr = req.params.id;
    const student = await Student.findByPk(pr);

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    console.log(student, "Fetched student data");

    const link = `http://localhost:7711/verify/${student.token}`;
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: "keshawn.vandervort@ethereal.email",
        pass: "ZqJPKYAGFpghds5MrR",
      },
    });

    const info = await transporter.sendMail({
      from: '"Shashank 👻" <shashankparmar352@gmail.com>',
      to: student.email, // Send email to the student's email
      subject: "Please verify your email",
      text: "Verify your email",
      html: `Click <a href="${link}">here</a> to verify your email.`,
    });

    console.log(info, "Email sent successfully");
    res.json({ msg: "Verification email sent", info });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({
      msg: "Failed to send email",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Student.findOne({ where: { email: email } });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .send(
          "Password is incorrect. Please enter the correct password or reset it."
        );
    }
    res
      .status(200)
      .send("Login successful. Username, email, and password are correct.");
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).send("Internal server error");
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedStudents = await Student.destroy({
      where: {
        id: id,
      },
    });
    if (deletedStudents == 0) {
      return res.status(404).send("Student not found");
    }
    res.status(200).send("Student deleted successfully");
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).send("Internal server error");
  }
};
exports.resetPass = async (req, res) => {
  const { firstName, oldPassword, newPassword } = req.body;
  try {
    const students = await Student.findAll({
      where: {
        firstName: firstName,
      },
    });
    if (students.length === 0) {
      return res.status(404).json({ msg: "Student not found" });
    }
    const student = students[0];
    const check = await bcrypt.compare(oldPassword, student.password);
    if (!check) {
      console.log("Your old password is wrong");
      return res.status(400).json({ msg: "Your old password is wrong" });
    }
    const salt = 10;
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await Student.update(
      { password: hashedPassword },
      { where: { id: student.id } }
    );
    res.status(200).json({ msg: "Password updated successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

const sendVerificationEmail = async (email, verificationToken) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: "keshawn.vandervort@ethereal.email",
      pass: "ZqJPKYAGFpghds5MrR",
    },
  });

  let info = await transporter.sendMail({
    from: '"Your Name" <your_email@example.com>',
    to: email,
    subject: "Password Reset",
    text: `Click the following link to reset your password: http://localhost:7711/resetpassword/${verificationToken}`,
    html: `<p>Click the following link to reset your password:</p><p><a href="http://localhost:7711/resetpassword/${verificationToken}">Reset Password</a></p>`, // HTML body
  });

  console.log("Message sent: %s", info.messageId);
};

exports.forgotPass = async (req, res) => {
  const { email } = req.body;

  try {
    const students = await Student.findAll({ where: { email } });

    if (!students || students.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const student = students[0];

    const payload = {
      id: student.id,
      firstName: student.firstName,
      mobile: student.mobile,
      email: student.email,
    };

    const verificationToken = jwt.sign(payload, "shashank", {
      expiresIn: "4h",
    });

    const updjwt = await Student.update(
      { token: verificationToken },
      { where: { id: student.id } }
    );
    console.log(verificationToken, "kkkkkkkkkkkkkkkk", updjwt);

    await sendVerificationEmail(email, verificationToken);

    res.status(200).json({ message: "Verification email sent successfully" });
  } catch (error) {
    console.error("Error in forgotPass:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const tokenn = req.params.id;
    console.log("Received token:", tokenn);
    const verified = jwt.verify(tokenn, "shashank");

    if (verified) {
      const links = `http://localhost:7711/updateNresetpassword`;
      res.send(`Verification successful, go to reset password: ${links}`);
    } else {
      res.status(400).json({ msg: "Token verification failed" });
    }
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(400).json({ msg: "Invalid or expired token." });
  }
};

exports.updateNresetpassword = async (req, res) => {
  try {
    const { newPassword, email } = req.body;
    const user = await Student.findOne({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const salt = 10;
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const updpass = await Student.update(
      { password: hashedPassword },
      { where: { email: email } }
    );

    if (updpass[0] === 1) {
      res.send("Password updated successfully");
    } else {
      res.status(500).json({ msg: "Failed to update password" });
    }
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

exports.updateMobile = async (req, res) => {
  try {
    const { firstName, OldMobile, NewMobile } = req.body;
    if (!firstName || !OldMobile || !NewMobile) {
      return res.status(400).send("Missing required parameters");
    }
    const student = await Student.findOne({
      where: {
        firstName: firstName,
      },
    });
    if (!student) {
      return res.status(404).send("Student not found");
    }
    if (student.mobile != OldMobile) {
      console.log("Old mobile number is incorrect");
      return res.status(400).send("Old mobile number is incorrect");
    }
    await Student.update({ mobile: NewMobile }, { where: { id: student.id } });
    res.send("Mobile number updated successfully");
  } catch (error) {
    console.error("Error updating mobile number:", error);
    res.status(500).send("Internal server error");
  }
};

exports.updateEmail = async (req, res) => {
  try {
    const { firstName, OldEmail, NewEmail } = req.body;
    if (!firstName || !OldEmail || !NewEmail) {
      return res.status(400).send("Missing required parameters");
    }
    const student = await Student.findOne({
      where: {
        firstName: firstName,
      },
    });
    if (!student) {
      return res.status(404).send("Student not found");
    }
    if (student.email != OldEmail) {
      console.log("Old email number is incorrect");
      return res.status(400).send("Old email  is incorrect");
    }
    await Student.update({ email: NewEmail }, { where: { id: student.id } });
    res.send("email updated successfully");
  } catch (error) {
    console.error("Error updating email :", error);
    res.status(500).send("Internal server error");
  }
};

exports.updateProfile = [
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const body = req.body;
      const file = req.file;
      console.log(body, "Body", file, "File");
      if (!file) {
        return res.status(400).send("No file uploaded");
      }
      const student = await Student.findOne({ where: { email: body.email } });
      if (!student) {
        return res.status(404).send("Student not found");
      }
      if (student.profilePicture) {
        fs.unlink(student.profilePicture, (err) => {
          if (err) {
            console.error("Error deleting old profile picture:", err);
          } else {
            console.log("Old profile picture deleted successfully");
          }
        });
      }
      await Student.update(
        { profilePicture: path.normalize(file.path) },
        { where: { id: student.id } }
      );
      res.status(201).send({ message: "Profile photo updated successfully" });
    } catch (error) {
      console.error("Error updating profile photo:", error);
      res.status(500).send("Internal Server Error");
    }
  },
];

exports.createStudent = [
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const body = await studSchema.validateAsync(req.body);
      const file = req.file;
      console.log(body, "Body", file, "File");
      if (!file) {
        return res.status(400).send("No profile picture uploaded");
      }
      const token = jwt.sign(body, "shashank", { expiresIn: "4h" });
      const salt = 10;
      const hashedPassword = await bcrypt.hash(body.password, salt);

      const existingFirstName = await Student.findOne({
        where: { firstName: body.firstName },
      });
      const existingEmail = await Student.findOne({
        where: { email: body.email },
      });

      if (existingFirstName) {
        return res.status(400).send("User with this first name already exists");
      }
      if (existingEmail) {
        return res.status(400).send("User with this email already exists");
      }
      if (body.firstName === body.lastName) {
        return res
          .status(400)
          .send("First name and last name cannot be the same");
      }
      const newStudent = await Student.create({
        profilePicture: path.normalize(file.path),
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: hashedPassword,
        mobile: body.mobile,
        token: token,
      });
      const sendmaillink = `http://localhost:7711/sendmail/${newStudent.id}`;
      const message = `Please verify your email: ${sendmaillink}`;
      const studentDetails = await Student.findOne({
        attributes: ["id", "firstName", "lastName", "email", "mobile"],
        where: { id: newStudent.id },
      });
      console.log("password:", newStudent.password, "token:", newStudent.token);
      res.status(201).send({ studentDetails, message: message });
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).send("Internal Server Error");
    }
  },
];

exports.verifyemailsubfunction = async (req, res) => {
  const token = req.params.id;
  try {
    const verified = jwt.verify(token, "shashank");
    res.send("User verification successful");
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(400).json({ msg: "Invalid or expired token." });
  }
};

exports.getStudent = async (req, res) => {
  const getdata = await Student.findAll({
    attributes: ["id", "firstName", "lastName", "email", "mobile"],
  });
  res.send(getdata);
};

exports.getOneStudent = async (req, res) => {
  const idd = req.params.id;
  const dis = await Student.findAll({
    attributes: ["id", "firstName", "lastName", "email", "mobile"],
    where: {
      id: idd,
    },
  });
  res.send(dis);
};



exports.updateAll = async (req, res) => {
  const body = req.body;
  console.log(req.body, "eeeeeeeeeeeeeeeeeeeeeeeeeeee");
  if (body.firstName && body.OldEmail && body.NewEmail) {
    try {
      const { firstName, OldEmail, NewEmail } = req.body;
      if (!firstName || !OldEmail || !NewEmail) {
        return res.status(400).send("Missing required parameters");
      }
      const student = await Student.findOne({
        where: {
          firstName: firstName,
        },
      });
      if (!student) {
        return res.status(404).send("Student not found");
      }
      if (student.email != OldEmail) {
        console.log("Old email number is incorrect");
        return res.status(400).send("Old email  is incorrect");
      }
      await Student.update({ email: NewEmail }, { where: { id: student.id } });
    } catch (error) {
      console.error("Error updating email :", error);
    }
  }
  if (body.firstName && body.OldMobile && body.NewMobile) {
    try {
      console.log(req.body, "mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm");

      const { firstName, OldMobile, NewMobile } = req.body;
      if (!OldMobile || !NewMobile) {
        return res.status(400).send("Missing required parameters");
      }
      const student = await Student.findOne({
        where: {
          firstName: body.firstName,
        },
      });
      console.log(student.mobile, "ffffffffffffffffffffffffffff");
      if (!student) {
        return res.status(404).send("Student not found");
      }
      if (student.mobile != OldMobile) {
        console.log("Old mobile number is incorrect");
        return res.status(400).send("Old mobile number is incorrect");
      }
      await student.update(
        { mobile: NewMobile },
        { where: { id: student.id } }
      );
    } catch (error) {
      console.error("Error updating mobile number:", error);
    }
  }
  if (body.profilePicture) {
    exports.updateProfile = [
      upload.single("profilePicture"),
      async (req, res) => {
        try {
          const body = req.body;
          const file = req.file;
          console.log(body, "Body", file, "File");
          if (!file) {
            return res.status(400).send("No file uploaded");
          }
          const student = await Student.findOne({
            where: { email: body.email },
          });
          if (!student) {
            return res.status(404).send("Student not found");
          }
          if (student.profilePicture) {
            fs.unlink(student.profilePicture, (err) => {
              if (err) {
                console.error("Error deleting old profile picture:", err);
              } else {
                console.log("Old profile picture deleted successfully");
              }
            });
          }
          await Student.update(
            { profilePicture: path.normalize(file.path) },
            { where: { id: student.id } }
          );
          res
            .status(201)
            .send({ message: "Profile photo updated successfully" });
        } catch (error) {
          console.error("Error updating profile photo:", error);
          res.status(500).send("Internal Server Error");
        }
      },
    ];
  }
  res.send("Data updated successfully");
};

// exports.updatedata = async (req, res) => {
//   const body = req.body;
//   const studentId = req.params.id;

//   try {
//     if (!studentId) {
//       return res.status(400).send("Student ID is missing");
//     }

//     const student = await Student.findByPk(studentId);

//     if (!student) {
//       return res.status(404).send("Student not found");
//     }

//     const updatedFields = {};

//     for (const key in body) {
//       if (Object.hasOwnProperty.call(body, key)) {
//         if (key !== "id" && key !== "profilePicture") {
//           updatedFields = body[key];
//         }
//       }
//     }
//     await Student.update(updatedFields, { where: { id: studentId } });

//     res.send("Data updated successfully");
//   } catch (error) {
//     console.error("Error updating data:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };

// exports.updatepatch = async (req, res) => {
//   try {
//     const body = req.body;
//     console.log(body);
//     const { firstName, OldEmail, NewEmail } = req.body;
//     if (!firstName || !OldEmail || !NewEmail) {
//       return res.status(400).send("Missing required parameters");
//     }
//     const student = await Student.findOne({
//       where: {
//         firstName: firstName,
//       },
//     });
//     if (!student) {
//       return res.status(404).send("Student not found");
//     }
//     if (student.email != OldEmail) {
//       console.log("Old email number is incorrect");
//       return res.status(400).send("Old email  is incorrect");
//     }
//     await Student.update({ email: NewEmail }, { where: { id: student.id } });
//   } catch (error) {
//     console.error("Error updating email :", error);
//   }
// };


exports.uploadProfilePicture = upload.single("profilePicture");
exports.updatedataaaaaa = async (req, res) => {
  const body = req.body;
  console.log(body);
  const idd = req.params.id;
  const fnd = await Student.findByPk(idd);
  const {OldfirstName,OldlastName,NewfirstName,NewlastName, OldEmail, NewEmail, OldMobile, NewMobile } = req.body;
  if (!fnd) {
    return res.status(404).send("Student not found");
  }
  if (req.body.OldfirstName) {
    if (fnd.firstName != OldfirstName) {
      console.log("Old firstName  is incorrect");
      return res.status(400).send("Old firstName  is incorrect");
    }
  }
  if (req.body.OldlastName) {
    if (fnd.lastName != OldlastName) {
      console.log("Old OldlastName  is incorrect");
      return res.status(400).send("Old OldlastName  is incorrect");
    }
  }
  if (req.body.OldEmail) {
    if (fnd.email != OldEmail) {
      console.log("Old email  is incorrect");
      return res.status(400).send("Old email  is incorrect");
    }
  }
  if (req.body.OldMobile) {
    if (fnd.mobile != OldMobile) {
      console.log("Old mobile number is incorrect");
      return res.status(400).send("Old mobile number is incorrect");
    }
  }
  if (req.body.profilePicture) {
    exports.updateProfile = [
      upload.single("profilePicture"),
      async (req, res) => {
        console.log(body, "Body", req.file, "File");
        if (!req.file) {
          return res.status(400).send("No file uploaded");
        }
        if (!fnd) {
          return res.status(404).send("Student not found");
        }
        if (fnd.profilePicture) {
          fs.unlink(fnd.profilePicture, (err) => {
            if (err) {
              console.error("Error deleting old profile picture:", err);
            } else {
              console.log("Old profile picture deleted successfully");
            }
          });
        }
      },
    ];
  }
  const upd = await Student.update(
    {
      firstName: body.NewfirstName,
      lastName: body.NewlastName,
      email: body.NewEmail,
      mobile: body.NewMobile,
    },
    { where: { id: idd } }
  );
  if (req.file) {
    const pups = await Student.update(
      {profilePicture : path.normalize(req.file.path)},
      {where:{id:idd}}
    )
  }
  res.send("data updated succesfully");
};


exports.jwtverify = async (req, res, next) => {
  try {
    const idd = req.params.id;
    const fnd = await Student.findOne({
      where: {
        id: idd
      }
    });
    if (!fnd) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const token = fnd.token; 
    console.log(token);
    if (!token) {
      return res.status(403).json({ message: 'No token provided' });
    }
    jwt.verify(token, 'shashank', (err, decoded) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to authenticate token' });
      }
      req.userId = decoded.id; 
      next();
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while verifying the token' });
  }
};


exports.profilePictureupdate =upload.single("profilePicture"), async(req,res,next)=>{
  const file = req.file;
  if (req.body.profilePicture) {
    exports.updateProfile = [
      upload.single("profilePicture"),
      async (req, res) => {
        console.log(body, "Body", req.file, "File");
        if (!req.file) {
          return res.status(400).send("No file uploaded");
        }
        if (!fnd) {
          return res.status(404).send("Student not found");
        }
        if (fnd.profilePicture) {
          fs.unlink(fnd.profilePicture, (err) => {
            if (err) {
              console.error("Error deleting old profile picture:", err);
            } else {
              console.log("Old profile picture deleted successfully");
            }
          });
        }
      },
    ];
  }
  next();
}
exports.updatedata = async(req,res)=>{
  const idd = req.params.id;
  const body = req.body;
  const file = req.file;
  const updd = Student.update({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      mobile: body.mobile,
  },{
    where:{
      id:idd
    }
  })
  if(req.file){
    const upddprofile = Student.update({
      profilePicture : path.normalize(req.file.path),
  },{
    where:{
      id:idd
    }
  })
  }
  
  res.send("data updated succesfully")
  
}