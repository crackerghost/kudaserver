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
const MapToken = require("./Models/mapMode");
app.use(express.json());

app.use(bodyParser.json());
app.use(cors());

connectToDatabase();

//function km to radians 
const kmToRadians = (km) => {
  return km / 6378.1; // Earth's radius in kilometers
};


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
  const { email, long, lat, cityName } = req.body;

  try {
    // Find user by email
    const user = await regModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user's location and cityName
    user.location = {
      type: 'Point',
      coordinates: [long, lat],
    };
    user.cityName = cityName;

    // Save updated user data
    await user.save();

    // Find users within a radius of 5 kilometers from the updated location
    const usersWithinRadius = await regModel.find({
      location: {
        $geoWithin: {
          $centerSphere: [[long, lat], kmToRadians(5)],
        },
      },
      role: "Buyer", // Assuming you want to find only buyers
    });

    // Respond with updated user data within the radius
    res.status(200).json({ usersWithinRadius });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});








app.post("/register", async (req, res) => {
  const { firstName,
        lastName,
        kyc,
        email,
        pass,
        role,
        idProof} = req.body;

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
        firstName,
        lastName,
        kyc,
        email,
        password: hashedPass,
        role,
        idProof,
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


////////addItems--------------------

app.post("/addItems", async (req, res) => {
  const { email, items } = req.body;

  try {
    // Find user by email
    const user = await regModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add new items to the existing items array
    user.items.push(...items);

    // Save updated user data
    await user.save();

    // Respond with updated user data
    return res.status(200).json({ message: 'Items added successfully', user });
  } catch (error) {
    console.error('Error adding items:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

///////requestOrder

app.post('/sendRequest', async (req, res) => {
  const { requesterEmail, requesterLocation, recipientEmail, additionalData ,scheduledTime } = req.body;

  try {
    // Check if the recipient exists
    const recipient = await regModel.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Create a new request object
    const newRequest = {
      requesterEmail,
      requesterLocation,
      recipientEmail,
      scheduledTime,
      additionalData, // Optional: add any additional data from the request body
      status: 'Pending', // Default status
      createdAt: new Date(), // Current date and time
    };

    // Save the request to the recipient's document
    recipient.requests.push(newRequest);
    await recipient.save();

    // Respond with success message
    return res.status(200).json({ message: 'Request sent successfully' });
  } catch (error) {
    console.error('Error sending request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/map-token', async (req, res) => {
  try {
    // Fetch the map token from the database
    const mapToken = await MapToken.findOne();

    // Check if token exists
    if (!mapToken) {
      return res.status(404).json({ error: 'Map token not found' });
    }

    // Send the token to the frontend
    res.json({ token: mapToken.token });
  } catch (error) {
    console.error('Error fetching map token:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/updateStatus', async (req, res) => {
  const { email, requestID, status } = req.body;

  try {
    // Update status in buyer's database
    const updatedRequest = await regModel.findByIdAndUpdate(
      requestID,
      { status: status },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    return res.status(200).json({ message: 'Status updated successfully', updatedRequest });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to update status in requester's database
app.post('/updateRequestStatus', async (req, res) => {
  const { requesterEmail, requestID, status } = req.body;

  try {
    // Update status in requester's database
    const updatedRequest = await regModel.findOneAndUpdate(
      { requesterEmail, _id: requestID },
      { status: status  },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    return res.status(200).json({ message: 'Request status updated successfully', updatedRequest });
  } catch (error) {
    console.error('Error updating request status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(3000, () => {
  console.log("listening on port 3000");
});
