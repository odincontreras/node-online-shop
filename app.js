const path = require("path");
const fs = require("fs");
//to encrypt transfered data between client and server
const https = require("https");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
//generate a token to verify if the frontend is yours, the package will look for a token in any post request
const csrf = require("csurf");
//The flash is a special area of the session used for storing messages. Messages are written to the flash and cleared after being displayed to the user.
const flash = require("connect-flash");
const multer = require("multer");
const moment = require("moment");
//to set many security headers
const helmet = require("helmet");
//to compress css, js and images files
const compression = require("compression");
//Allows to log request data into files
const morgan = require("morgan");

const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URI = process.env.MONGO_URI;

const app = express();
const store = new MongoDBStore({
	uri: MONGODB_URI,
	collection: "sessions",
});
const csrfProtection = csrf();

// const privateKEY = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const accessLogStream = fs.createWriteStream(
	path.join(__dirname, "access.log"),
	{ flags: "a" }
);

//set many header to improve security
app.use(helmet());
//to compress css, js and images files
app.use(compression());

//Allows to log request data into files
app.use(morgan("combined", { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));
//tells multer to expect a request with a single file with a name of image
const fileStorage = multer.diskStorage({
	destination: (rq, file, cb) => {
		cb(null, "images");
	},
	filename: (req, file, cb) => {
		cb(null, moment() + "-" + file.originalname);
	},
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === "image/png" ||
		file.mimetype === "image/jpg" ||
		file.mimetype === "image/jpeg"
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

app.use(multer({ storage: fileStorage, fileFilter }).single("image"));
app.use(express.static(path.join(__dirname, "public")));
//if we get a request to /images express will serve the images folder
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
	session({
		secret: "my secret",
		resave: false,
		saveUninitialized: false,
		store: store,
	})
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
	//locals set variables to use in every view
	res.locals.isAuthenticated = req.session.isLoggedIn;
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.use((req, res, next) => {
	//when you throw an erro in sync code express will execute the next error handler directly without using next(new Error(err))
	// throw new Error('Sync Dummy')
	if (!req.session.user) {
		return next();
	}
	User.findById(req.session.user._id)
		.then((user) => {
			if (!user) {
				return next();
			}
			req.user = user;
			next();
		})
		.catch((err) => {
			next(new Error(err));
		});
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

//all errors using next(error) will execute this code block.
app.use((error, req, res, next) => {
	//res.status(error.httpStatusCode).render(...)
	res.redirect("/500");
});

mongoose
	.connect(MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false,
	})
	.then((result) => {
		//this PORT emv variable is set by the hosting
		app.listen(process.env.PORT || 3000);
		//to create https server
		// https
		// 	.createServer({ key: privateKEY, cert: certificate }, app)
		// 	.listen(process.env.PORT || 3000);
	})
	.catch((err) => {
		console.log(err);
	});
