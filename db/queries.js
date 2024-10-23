const pool = require("./pool");

async function insertUser(firstName, lastName, username, password) {
	await pool.query(
		"INSERT INTO users (first_name, last_name, username, password, membership_status) VALUES ($1, $2, $3, $4, $5)",
		[firstName, lastName, username, password, "Basic"]
	);
}

async function getUser(user) {
	const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [user]);
	return rows[0];
}

async function getMessages() {
	const { rows } = await pool.query("SELECT * FROM messages");
	return rows;
}

async function getMessage(messageId) {
	const { rows } = await pool.query(`SELECT * FROM messages WHERE messages.id = ${messageId}`);
	return rows;
}

async function getUserPerMessage() {
	const { rows } = await pool.query(
		"SELECT users.first_name, users.last_name, users.username, users.membership_status, messages.timestamp FROM users JOIN messages ON users.id = messages.user_id"
	);
	return rows;
}

async function postPost(userId, title, messageText) {
	await pool.query("INSERT INTO messages (user_id, message_text, title) VALUES ($1, $2, $3)", [
		userId,
		title,
		messageText,
	]);
}

async function updateMembershipStatus(passcode, userId) {
	if (passcode === process.env.MEMBER) {
		await pool.query(`UPDATE users SET membership_status = 'Member' WHERE users.id = ${userId}`);
	} else if (passcode === process.env.ADMIN) {
		await pool.query(`UPDATE users SET membership_status = 'Admin' WHERE users.id = ${userId}`);
	} else if (passcode === process.env.BASIC) {
		await pool.query(`UPDATE users SET membership_status = 'Basic' WHERE users.id = ${userId}`);
	}
}

async function deleteMessage(messageId) {
	await pool.query(`DELETE FROM messages WHERE messages.id = ${messageId}`);
}

module.exports = {
	insertUser,
	getUser,
	getMessages,
	getMessage,
	getUserPerMessage,
	postPost,
	updateMembershipStatus,
	deleteMessage,
};
