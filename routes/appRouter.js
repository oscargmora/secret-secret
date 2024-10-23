const { Router } = require("express");
const appController = require("../controllers/appController");
const appRouter = Router();

appRouter.get("/", appController.indexGet);
appRouter.get("/signUp", appController.signUpGet);
appRouter.post("/signUp", appController.signUpPost);
appRouter.get("/homepage", appController.homepageGet);
appRouter.get("/logIn", appController.logInGet);
appRouter.post("/logIn", appController.logInPost);
appRouter.get("/createPost", appController.createPostGet);
appRouter.post("/createPost", appController.createPostPost);
appRouter.get("/joinClub", appController.joinClubGet);
appRouter.post("/joinClub", appController.joinClubPost);
appRouter.get("/:id/delete", appController.deleteGet);
appRouter.post("/:id/delete", appController.deletePost);
appRouter.get("/logOut", appController.logOut);

module.exports = appRouter;
