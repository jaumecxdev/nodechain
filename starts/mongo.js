const dbConfig = require('../config/mongo.config.js');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(dbConfig.url + global.app.nodeId, {
    //useNewUrlParser: true
    autoIndex: false
}).then(() => {
    console.log("Database Connected Successfully. NodeId: " + global.app.nodeId);    
}).catch(err => {
    console.log('Could not connect to the database', err);
    process.exit();
});

//mongoose.set('autoIndex', false);