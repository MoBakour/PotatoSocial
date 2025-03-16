// imports
const potatodb = require("potatodb");

// set and create database
potatodb.setRoot("", "database");
const DB = potatodb.createDatabase("db");

// set and create farms
const Users = DB.createFarm("Users");
const Posts = DB.createFarm("Posts");
const Comments = DB.createFarm("Comments");

// exports
module.exports = { Users, Posts, Comments };
