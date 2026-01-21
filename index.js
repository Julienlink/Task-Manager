const express = require("express");
const mongoose = require("mongoose");
const hbs = require("hbs");
const path = require("path");
require('dotenv').config();


const app = express();
const PORT = 3000;

//test connection a la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

app.set("view engine","hbs");
app.set('views', path.join(__dirname, 'src/views'));

hbs.registerPartials(path.join(__dirname, "/src/views/partials"))


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

//connection avec la base de données
connectDB();
const tacheSchema = new mongoose.Schema({}, { strict: false }); // accepte tous les champs
const Tache = mongoose.model("Tache", tacheSchema, "tasks"); // "taches" = nom de ta collection

//initialise les routes
app.get("/", (req, res) => {
  res.render("index");
});

//inclure les routes
const router = require("./src/router/routes");
app.use("/",router.router);






//lance le serveur web
app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on http://localhost:"+ PORT);
    else 
        console.log("Error occurred, server can't start", error);
    } 
);


