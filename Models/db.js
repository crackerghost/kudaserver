const mongoose = require('mongoose');

const uri = 'mongodb+srv://singhrajtilak64:rajsingh123%40@cluster0.aju0wt8.mongodb.net/wastewise?retryWrites=true&w=majority';


async function connectToDatabase() {
    try {
        await mongoose.connect(uri);
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection error:', error);
    }
}

module.exports = connectToDatabase;
