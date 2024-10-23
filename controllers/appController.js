const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const db = require("../db/queries");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const pool = require("../db/pool.js");

const alphaErr = "must only contain letters.";
const lengthErr = "must be between 1 and 20 characters.";

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	try {
		const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
		const user = rows[0];

		done(null, user);
	} catch (err) {
		done(err);
	}
});

passport.use(
	new LocalStrategy(async (username, password, done) => {
		try {
			const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
			const user = rows[0];

			if (!user) {
				return done(null, false, { message: "Incorrect username" });
			}

			const match = await bcrypt.compare(password, user.password);
			if (!match) {
				// passwords do not match!
				return done(null, false, { message: "Incorrect password" });
			}

			return done(null, user);
		} catch (err) {
			return done(err);
		}
	})
);

const signUpValidation = [
	body("firstName")
		.trim()
		.isAlpha()
		.withMessage(`First Name ${alphaErr}`)
		.isLength({ min: 1, max: 20 })
		.withMessage(`First Name ${lengthErr}`),

	body("lastName")
		.trim()
		.isAlpha()
		.withMessage(`Last Name ${alphaErr}`)
		.isLength({ min: 1, max: 20 })
		.withMessage(`Last Name ${lengthErr}`),

	body("username")
		.trim()
		.isAlphanumeric()
		.withMessage(`Username must contain only letters and numbers.`)
		.isLength({ min: 1, max: 20 })
		.withMessage(`Username must be between ${lengthErr}`),

	body("password")
		.trim()
		.isLength({ min: 8, max: 255 })
		.withMessage("Password must be at least 8 characters long and a maximum of 255 characters long.")
		.matches(/\d/)
		.withMessage("Password must contain at least one number")
		.matches(/[!@#$%^&*(),.?":{}|<>]/)
		.withMessage("Password must contain at least one special character")
		.not()
		.isIn(["12345678", "password", "qwerty"])
		.withMessage("Do not use a common password"),

	body("confirmPassword").custom((value, { req }) => {
		if (value !== req.body.password) {
			throw new Error("Passwords do not match");
		}
		return true;
	}),
];

async function indexGet(req, res) {
	res.render("index");
}

async function signUpGet(req, res) {
	res.render("signUp", {
		errors: {},
		inputs: {},
	});
}

const signUpPost = [
	signUpValidation,
	asyncHandler(async (req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).render("signUp", {
				errors: errors.array(),
				inputs: req.body,
			});
		}

		bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
			if (err) {
				return next(err);
			}

			try {
				await db.insertUser(
					req.body.firstName,
					req.body.lastName,
					req.body.username,
					hashedPassword
				);

				res.redirect("logIn");
			} catch (err) {
				return next(err);
			}
		});
	}),
];

async function homepageGet(req, res) {
	const user = await db.getUser(req.session.passport.user);
	const messages = await db.getMessages();
	let i = -1;

	const messagesWithUserInfo = await Promise.all(
		messages.map(async (message) => {
			const messageInformation = await db.getUserPerMessage();
			i++;
			return {
				...message,
				authorFirstName: messageInformation[i].first_name,
				authorLastName: messageInformation[i].last_name,
				authorUsername: messageInformation[i].username,
				authorMembershipStatus: messageInformation[i].membership_status,
			};
		})
	);

	res.render("homepage", {
		firstName: user.first_name,
		messages: messagesWithUserInfo,
		membershipStatus: user.membership_status,
	});
}

async function logInGet(req, res) {
	res.render("logIn", {
		errors: {},
		inputs: {},
	});
}

const logInPost = [
	asyncHandler(async (req, res, next) => {
		passport.authenticate("local", (err, user, info) => {
			if (err) {
				return next(err);
			}

			if (!user) {
				return res.status(400).render("logIn", {
					errors: { authentication: [info.message] },
					inputs: req.body,
				});
			}

			req.logIn(user, (err) => {
				if (err) {
					return next(err);
				}
				return res.redirect("/homepage");
			});
		})(req, res, next);
	}),
];

async function createPostGet(req, res) {
	res.render("createPost", {
		errors: {},
		inputs: {},
	});
}

const createPostPost = [
	body("title")
		.trim()
		.notEmpty()
		.withMessage("Message cannot be empty.")
		.isLength({ max: 20 })
		.withMessage("Title cannot exceed 20 characters"),

	body("message")
		.trim()
		.notEmpty()
		.withMessage("Message cannot be empty.")
		.isLength({ max: 280 })
		.withMessage("Message cannot exceed 280 characters"),

	asyncHandler(async (req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).render("createPost", {
				errors: errors.array(),
				inputs: req.body,
			});
		}

		await db.postPost(req.session.passport.user, req.body.title, req.body.message);

		res.redirect("/homepage");
	}),
];

async function joinClubGet(req, res) {
	res.render("joinClub");
}

async function joinClubPost(req, res) {
	const user = await db.getUser(req.session.passport.user);
	const userId = user.id;
	const passcode = req.body.passcode;
	await db.updateMembershipStatus(passcode, userId);
	res.redirect("/homepage");
}

const deleteGet = asyncHandler(async (req, res) => {
	const message = await db.getMessage(req.params.id);
	res.render("delete", {
		message: message[0],
	});
});

async function deletePost(req, res) {
	await db.deleteMessage(req.params.id);
	res.redirect("/homepage");
}

const logOut = [
	asyncHandler(async (req, res, next) => {
		req.logout((err) => {
			return next(err);
		});
		res.redirect("/");
	}),
];

module.exports = {
	indexGet,
	signUpGet,
	signUpPost,
	homepageGet,
	logInGet,
	logInPost,
	createPostGet,
	createPostPost,
	joinClubGet,
	joinClubPost,
	deleteGet,
	deletePost,
	logOut,
};
