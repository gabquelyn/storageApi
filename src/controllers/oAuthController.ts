import expressAsyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../model/user";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const verifyToken = async (token: string) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return payload;
};
export const oauthLoginHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { credential } = req.body;
    const payload = await verifyToken(credential);
    if (!payload || !payload.email_verified)
      return res.status(400).json({ message: "Bad request" });
    const foundUser = await User.findOne({ where: { email: payload.email } });
    if (!foundUser)
      return res.status(404).json({ message: "User does not exist" });
    const accessToken = jwt.sign(
      {
        UserInfo: {
          email: foundUser.email,
          userId: foundUser.id,
        },
      },
      String(process.env.ACCESS_TOKEN_SECRET),
      { expiresIn: "1h" }
    );

    // create the refresh token
    const refreshToken = jwt.sign(
      { email: foundUser.email },
      String(process.env.REFRESH_TOKEN_SECRET),
      { expiresIn: "1d" }
    );

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken });
  }
);

export const oauthSignupHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { credential } = req.body;
    const payload = await verifyToken(credential);
    if (!payload?.email || !payload.email_verified)
      return res.status(400).json({ message: "Bad request" });
    const email = payload.email;
    const foundUser = await User.findOne({ where: { email } });
    if (foundUser)
      return res.status(400).json({ message: "Account already exists" });
    const hashedPassword = bcrypt.hashSync(uuid(), bcrypt.genSaltSync(10));
    const newUser = await User.create({
      email,
      name: payload.name!,
      password: hashedPassword,
      verified: true,
    });
    return res.status(200).json({ messsage: "Account created successfully" });
  }
);
