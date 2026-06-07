import { clerkClient, getAuth } from "@clerk/express";
import type { Response, Request, NextFunction } from "express";

import type { AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ message: "User not found" });
			return;
		}
		res.json(user);
	} catch (error) {
		res.status(500);
		next(error);
	}
}

export async function authCallBack(req: Request, res: Response, next: NextFunction) {
	try {
		const { userId: clerkId } = getAuth(req);
		if (!clerkId) {
			res.status(401).json({ message: "Unauthorized - invalid token" });
			return;
		}
		let user = await User.findOne({ clerkId });
		if (!user) {
			// get user from clerk and save to db
			const clerkUser = await clerkClient.users.getUser(clerkId);
			user = new User({
				clerkId,
				name: clerkUser.firstName
					? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
					: clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0],
				email: clerkUser.emailAddresses[0]?.emailAddress,
				avatar: clerkUser.imageUrl,
			});
			await user.save();
		}
		res.json(user);
	} catch (error) {
		res.status(500);
		next(error);
	}
}
