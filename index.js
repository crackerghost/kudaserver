const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require('cors');
const secretKey = "rajsingh123@";
const connectToDatabase = require("./Models/db");
const regModel = require('./Models/regModel'); // Import RegModel
const bodyParser = require('body-parser');
app.use(express.json());

app.use(bodyParser.json());
app.use(cors());

connectToDatabase();

app.get("/", (req, res) => {
  res.send("Hello from the root of the API!");
});

app.post('/verifyLogin', async (req, res) => {
  const { email, pass } = req.body;
  try {
    // Find user by email
    const user = await regModel.findOne({ email });

    // If user exists, compare passwords
    if (user) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        const token = jwt.sign({ email: user.email }, secretKey, { expiresIn: '1h' });
        console.log(token);
        return res.status(200).send({ data: 'Login Success', token , email});
      } else {
        return res.status(400).send({ data: 'Password Incorrect' });
      }
    }else{
      return res.status(401).send({data :'Invalid User'})
    }
  } catch (error) {
    console.error('Error in /verifyLogin:', error);
    return res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.post('/updatelocation', async (req, res) => {
  const { email,long,lat} = req.body;
   console.log(email);
  try {
    // Find user by email
    const user = await regModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user's location
    user.location = {
      type: 'Point',
      coordinates: [long, lat],
    };

    // Save updated user data
    await user.save();

    // Respond with updated user data
    res.status(200).json(user);
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post("/register", async (req, res) => {
  const { email, name,lastname, pass, kyc,role ,type} = req.body;

  try {
    // Check if user with the same email already exists
    const existingUser = await regModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Hash the password
    const hashedPass = await bcrypt.hash(pass, 10);

    // Create a new user instance
    const newUser = new regModel({
      email,
      name,
      lastname,
      password: hashedPass,
      kyc,
      role,
      type,
    });

    // Save the user to the database
    await newUser.save();

    // Generate JWT token for the registered user
    const token = jwt.sign({ email: newUser.email }, secretKey, { expiresIn: "1h" });

    // Respond with success message and token
    res.status(201).json({ message: "User registered successfully", token , email });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/userData", async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).send({ error: "Email query parameter is required" });
  }

  try {
    // Exclude the password field
    const user = await regModel.findOne({ email }).select('-password');
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    return res.status(200).send({ user });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
});

app.get("/verifytoken", (req, res) => {
  
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).send({ error: "Authorization header missing" });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).send({ error: "Token missing from Authorization header" });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(500).send({ error: "Token verification failed" });
    }
    return res.status(200).send({ data: decoded });
  });
});


app.listen(3000, () => {
  console.log("listening on port 3000");
});
