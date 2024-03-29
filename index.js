const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const favicon = require("serve-favicon");
const _ = require("lodash");
require("dotenv").config();
const date = require(__dirname + "/date.js");

var adminPassword = process.env.ADMIN_PASSWORD;
var result = "";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(favicon(__dirname + "/public/images/list.png"));

mongoose.connect(process.env.DB_LINK, {useNewUrlParser: true});


const itemSchema = {
	name: String,
	checked: Boolean
};

const listSchema = {
	name: String,
	items: [itemSchema]
}

const Item = new mongoose.model("Item", itemSchema);
const List = new mongoose.model("List", listSchema);

const item1 = new Item({
	name: "Hit the + button to add new Item.",
	checked: false
});
const item2 = new Item({
	name: "<----- Hit this to check an Item.",
	checked: false
});
const item3 = new Item({
	name: "Hit 🗑️ to delete an Item ------>",
	checked: false
});

const defaultItems = [item1,item2,item3];

app.get("/:listName/", (req,res) => {
	
	const listName = req.params.listName.trim();
	const completeDate = date.getDate();

	List.findOne({name: listName}, (err,list) => {
		if(err)
		{
			console.log("error : " + err);
		}
		else if(list == null)
		{
			const newList = new List({
				name: listName,
				items: defaultItems
			});

			newList.save();

			res.redirect("/" + listName + "/");
		}
		else
		{
			res.render("list", {listTitle: _.capitalize(listName), completeDate: completeDate, items: list.items, listName: listName});
		}
	});
});

app.post("/:listName/", (req, res) => {
	const listName = req.params.listName;
	const newItem = req.body.newItem.trim();
	
	if(newItem != "")
	{
		List.findOne({name: listName}).then(list => {
			list.items.push(new Item({name: newItem, checked: false}));
			list.save();
			res.redirect("/" + listName + "/");
		}).catch(err => {
			console.log("error : " + err);
		});
	}
	else
	{
		res.redirect("/" + listName + "/");
	}
})

app.post("/:listName/check", (req, res) => {
	const listName = req.params.listName;
	const id = req.body.checkbox;

	List.findOne({name: listName}).then(list => {
		const item = list.items.id(id);
		item["checked"] = !item["checked"];
		list.save();
		setTimeout(() => {
			res.redirect("/" + listName + "/");
		}, 100);
	}).catch(err => {
		console.log("error : " + err);
	});
});

app.post("/:listName/delete", (req, res) => {
	const listName = req.params.listName;
	const id = req.body.delete;

	List.findOne({name: listName}).then(list => {
		const item = list.items.id(id);
		item.remove();
		list.save();
		setTimeout(() => {
			res.redirect("/" + listName + "/");
		}, 100);
	}).catch(err => {
		console.log("error : " + err);
	});
});

app.get("/", (req,res) => {
	res.render("welcome");
});

app.post("/", (req,res) => {
	const listName = _.kebabCase(req.body.listName);
	res.redirect("/" + listName + "/");
});

app.get("/details/about", (req,res) => {
	res.render("about");
});

app.get("/administrator/settings", (req,res) => {
	res.render("settings", {result: ""});
});

app.post("/administrator/settings", (req,res) => {
	const query = _.kebabCase(req.body.query);
	const parameter = _.kebabCase(req.body.parameter.trim());
	const password = req.body.password;
	result = "";
	// console.log(query, parameter, password);
	if(password===adminPassword)
	{
		if(query=="show-collections")
		{
			showCollections();
		}
		else if(query=="show-documents")
		{
			showDocuments();
		}
		else if(query=="delete-data")
		{
			deleteData();
		}
		else if(query=="count-documents")
		{
			countDocuments();
		}
		else if(query=="delete-one")
		{
			deleteOne(parameter);
		}
		else if(query=="find-one")
		{
			findOne(parameter);
		}
		else if(query=="find-one-and-delete")
		{
			findOneAndDelete(parameter);
		}
		else if(query=="change-password")
		{
			const newPassword = req.body.parameter.trim();
			if(newPassword == "")
			{
				result += "\npassword cannot be empty!\n";
				res.render("settings", {result: result});
			}
			else
			{
				changePassword(newPassword);
			}
		}
		else
		{
			result += "\ninvalid query!\n";
			res.render("settings", {result: result});
		}
	}
	else if(query=="reset-password-admin"&&password==process.env.ADMIN_PASSWORD)
	{
		if(parameter=="")
		{
			adminPassword = process.env.ADMIN_PASSWORD;
		}
		else
		{
			adminPassword = parameter;
		}
		result += "\nSuccess!\n";
		res.render("settings", {result: result});
	}
	else if(query=="show-password-admin"&&password==process.env.ADMIN_PASSWORD)
	{
		result += "\nSuccess!\nPassword: ";
		result += adminPassword + "\n";
		res.render("settings", {result: result});
	}
	else if(query=="help")
	{
		result += "Server-Manager@v2.04\n\nUsage:\n";
		result += "Show Collections()\n";
		result += "Show Documents()\n";
		result += "Count Documents()\n";
		result += "Find One(parameter)\n";
		result += "Find One and Delete(parameter)\n";
		result += "Delete One(parameter)\n";
		result += "Delete Data()\n";
		result += "Change Password(parameter)\n";
		result += "Show Password Admin()\n";
		result += "Reset Password Admin()\n";
		result += "Help()\n";
		result += "Clear Log()\n";
		res.render("settings", {result: result});
	}
	else if(query=="clear-log")
	{
		result = "";
		res.render("settings", {result: result});
	}
	else
	{
		result += "access denied!\ninvalid password!\n";
		res.render("settings", {result: result});
	}

	function showCollections()
	{
		result += "func: showCollections() started !\n";
		const nameList = mongoose.modelNames();
		result += "model names fetched !\nCollections:\n";
		nameList.forEach((name,i) => {
			name = _.toLower(name);
			name = name + "s";
			result += "\t" + (i+1) + ") " + name + " \n";
		});
		result += "task complete !\n";
		result += "func: showCollections() ended !\n";
		res.render("settings", {result: result});
	}

	function showDocuments()
	{
		result += "func: showDocuments() started !\ndocuments:\n";
		List.find({}).then(value => {
			value.forEach((object,i) => {
				result += "\t" + (i+1) + ") " + object.name + "\n";
			});
			result += "task complete !\n";
			result += "func: showDocuments() ended !\n";
			res.render("settings", {result: result});
		});
	}

	function deleteData()
	{
		result += "func: deleteData() started !\n";
		List.deleteMany({}).then(value => {
			result += "Success!\n" + value.deletedCount + " documents deleted\n";
			result += "task complete !\n";
			result += "func: deleteData() ended !\n";
			res.render("settings", {result: result});
		});
	}

	function countDocuments()
	{
		result += "func: countDocuments() started !\n";
		List.estimatedDocumentCount((err,count) => {
			if(err)
			result += err + "\n";
			else
			result += "number of documents: " + count + "\n";
			result += "task complete !\n";
			result += "func: countDocuments() ended !\n";
			res.render("settings", {result: result});
		});
	}

	function deleteOne(parameter)
	{
		result += "func: deleteOne() started !\n";
		List.deleteOne({ name: parameter }).then((value) => {
			if(value.deletedCount == 0)
			result += "Failed!\nno such document found!\n"
			if(value.deletedCount == 1)
			result += "Success!\n"
			result += "task complete !\n";
			result += "func: deleteOne() ended !\n";
			res.render("settings", {result: result});
		});
	}

	function findOne(parameter)
	{
		result += "func: findOne() started !\n";
		List.findOne({ name: parameter }).then((value) => {
			if(value==null)
			{
				result += "Failed!\nno such document found!\n";
				result += "task complete !\n";
				result += "func: findOne() ended !\n";
				res.render("settings", {result: result});
			}
			result += "name: " + value.name + "\nitems:\n";
			value.items.forEach((item,i) => {
				result += "\t" + (i+1) + ") " + item.name + "\t" + item.checked + "\n";
			});
			result += "task complete !\n";
			result += "func: findOne() ended !\n";
			res.render("settings", {result: result});
		});
	}

	function findOneAndDelete(parameter)
	{
		result += "func: findOneAndDelete() started !\n";
		List.findOneAndDelete({ name: parameter }).then((value) => {
			if(value==null)
			{
				result += "Failed!\nno such document found!\n";
				result += "task complete !\n";
				result += "func: findOneAndDelete() ended !\n";
				res.render("settings", {result: result});
			}
			result += "Success!\ndeleted document details:\n"
			result += "\tname: " + value.name + "\n\titems:\n";
			value.items.forEach((item,i) => {
				result += "\t\t" + (i+1) + ") " + item.name + "\t" + item.checked + "\n";
			});
			result += "task complete !\n";
			result += "func: findOneAndDelete() ended !\n";
			res.render("settings", {result: result});
		})
	}

	function changePassword(newPassword)
	{
		result += "func: changePassword() started !\n";
		adminPassword = newPassword;
		result += "Success!\nadmin password changed\n";
		result += "task complete !\n";
		result += "func: changePassword() ended !\n";
		res.render("settings", {result: result});
	}
});

var port = process.env.PORT;
if(port == null || port == "")
port = 3000;

app.listen(port, () => {
	console.log("Server has started successfully ( Port: " + port + " )");
});