const potatodb = require("potatodb");

// options
const options = {
    rootOptions: {
        rootName: "potatodb",
    },
    dbOptions: {
        overwrite: false,
    },
    farmOptions: {
        _id: true,
        timestamps: true,
    },
};

// set and create database
potatodb.setRoot(options.rootOptions);
const DB = potatodb.createDatabase("db", options.dbOptions);

const Users = DB.createFarm("Users", options.farmOptions);
const Posts = DB.createFarm("Posts", options.farmOptions);
const Comments = DB.createFarm("Comments", options.farmOptions);

// exports
module.exports = { Users, Posts, Comments };
