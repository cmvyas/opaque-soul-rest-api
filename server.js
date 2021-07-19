const e = require("express");
const express = require("express");
const app = express();
const cors = require("cors");
const knex = require("knex");
const { response } = require("express");
const bcrypt = require("bcrypt-nodejs");
const fileUpload = require("express-fileupload");

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "root",
    database: "opaque-soul",
  },
});

app.use(express.json());
app.use(cors());
app.use(fileUpload());

app.get("/", (req, res) => {
  res.send("it is working");
});

app.post("/signin", (req, res) => {
  db.select("email", "hash")
    .from("login")
    .where("email", "=", req.body.email)
    .then((data) => {
      // const isValid = bcrypt.compareSync(req.body.password, data[0].hash);

      // if (isValid) {
      return db
        .select("*")
        .from("userregister")
        .where("email", "=", req.body.email)
        .then((user) => {
          res.json(user[0]);
        })
        .catch((err) => res.status(400).json("unable to get user"));
      // }
    })
    .catch((err) => res.status(400).json("no data match"));
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction((trx) => {
    trx
      .insert({
        hash: hash,
        email: email,
      })
      .into("login")
      .returning("email")
      .then((loginEmail) => {
        return trx("userregister")
          .returning("*")
          .insert({
            email: loginEmail[0],
            name: name,
          })
          .then((user) => {
            res.json(user[0]);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch((err) => res.json("unable to connect"));
});

app.post("/newArticle", async (req, res) => {
  const { title, subtitle, story, email, highlight } = req.body;

  db("articles")
    .returning("*")
    .insert({
      title: title,
      subtitle: subtitle,
      story: story,
      highlight: highlight,
      email: email,
    })
    .then((article) => {
      res.json(article[0]);
    });
});

app.get("/opaque-soul/readers", (req, res) => {
  db.select("*")
    .from("articles")
    .then((articles) => {
      if (articles.length) {
        res.json(articles);
      } else {
        res.status(400).json("not found");
      }
    });
});

app.get("/opaque-soul/writers/:email", (req, res) => {
  const { email } = req.params;

  db.select("*")
    .from("articles")
    .where({ email })
    .then((articles) => {
      res.json(articles);
    });
});

app.get("/opaque-soul/readers/:currentid", (req, res) => {
  const { currentid } = req.params;
  const id = Number.parseInt(currentid);

  db.select("*")
    .from("articles")
    .where({ id })
    .then((articles) => {
      res.json(articles[0]);
    });
});

/*
/signin -->post =success/fail
/register -->post = new user 
/profile/:userId-->get=user
/article save --> post 
/article fetch -->put
*/

app.listen(process.env.PORT || 4001, () => {
  console.log("app run ho rha hai");
});
