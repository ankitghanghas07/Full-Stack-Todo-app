const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const itemSchema = {
  name: String,
};

const listSchema = {
  name : String,
  items : [itemSchema]
};

const Item = mongoose.model("item", itemSchema);
const List = mongoose.model("List", listSchema);


// create some default items(documents)
const item1 = new Item({
  name: "buy food",
});

const item2 = new Item({
  name: "give cf contest",
});

const defaultItems = [item1, item2];

const workItems = [];

app.get("/", function (req, res) {
  Item.find({}, function (err, result) {
    if (err) 
      console.log(err);
    if (result.length == 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) console.log(err);
        else console.log("succesfully added");
      });
    } 
    res.render("list", { listTitle: "Today", newListItems: result });
  });
});


app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name : itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name : listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
    });
    res.redirect("/" + listName);
  }

  
});

app.post("/delete", function(req, res){
  // console.log(req.body.checkedItem);
  // console.log(req.body);
  const checkedItemId = req.body.checkedItem;
  const listName = _.capitalize(req.body.listName);
  console.log(listName);

  if(listName === "Today"){
    Item.findByIdAndRemove(req.body.checkedItem, function(err){
      if(err)
        console.log(err);
    });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : checkedItemId}}}, function(err, result){
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }
});


app.get("/:customList", function(req, res){
  const customListName = _.capitalize(req.params.customList);

  List.findOne({name : customListName}, function(err, foundList){
    // foundList is an object
    if(!err){
      if(!foundList){
        console.log("doesnot exist");
        const list = new List({
          name : customListName,
          items : defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else res.render("list", { listTitle: foundList.name , newListItems: foundList.items });
    }
  })  
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
