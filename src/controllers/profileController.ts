import expressAsyncHandler from "express-async-handler";
import { Request, Response } from "express";
import User from "../model/user";
import { CustomRequest } from "../../types";
export const getProfileHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req as CustomRequest).userId;
    const foundUser = await User.findByPk(userId);
    if (!foundUser) return res.status(404);
    return res.status(200).json({ ...foundUser.dataValues });
  }
);

export const updateProfileHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req as CustomRequest).userId;
    const { name, phone, address, country } = req.body;
    const foundUser = await User.findByPk(userId);
    if (!foundUser) return res.status(404);
    foundUser.name = name;
    foundUser.phone = phone;
    foundUser.address = address;
    foundUser.country = country;
    await foundUser.save();
    return res.status(201).json({ message: "Updated status successfully" });
  }
);
