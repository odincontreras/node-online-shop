const express = require("express");

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");
const { body } = require("express-validator/check");
const router = express.Router();

// /admin/add-product => GET
//You can add as many middlewares as you want, the funtions will be parsed from left to right
router.get(
	"/add-product",
	isAuth,
	adminController.getAddProduct
);

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
	"/add-product",
	[
		body(
			"title",
			"Invalid title, not special characters are allowed and the minimum length needs to be of 3 words"
		)
			.trim()
			.isString()
			.isLength({ min: 3 }),
		body("price").trim().isFloat().withMessage("Invalid Price"),
		body("description")
			.trim()
			.isLength({ min: 5, max: 400 })
			.withMessage(
				"Please set a message with a minimum length of 4 words and a maximum of 400 words."
			),
	],
	isAuth,
	adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
	"/edit-product",
	[
		body(
			"title",
			"Invalid title, not special characters are allowed and the minimum length needs to be of 3 words"
		)
			.trim()
			.isString()
			.isLength({ min: 3 }),
		body("price").trim().isFloat().withMessage("Invalid Price"),
		body("description")
			.trim()
			.isLength({ min: 5, max: 400 })
			.withMessage(
				"Please set a message with a minimum length of 4 words and a maximum of 400 words."
			),
	],
	isAuth,
	adminController.postEditProduct
);

router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
