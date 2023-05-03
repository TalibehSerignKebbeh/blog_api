

const mongoose = require('mongoose')
const connectDatabase = async () => {
    
await mongoose.connect(process.env.LOCAL_DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((con) => {
    console.log("connected to database");
    }).catch(err => {
    console.log(err);
    })
}

module.exports = connectDatabase



// const connectDb = async () => {
//     try {
// const client = await mongodb.MongoClient(process.env.LOCAL_DATABASE_URL)
//         return client;
        
//     } catch (error) {
//         return error
//     }


// }

// module.exports = connectDb;