import { Response, Request } from "express";
import expressAsyncHandler from "express-async-handler";
import Token from "../model/token";
import User from "../model/user";
import sendMail from "../utils/sendMail";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { differenceInMinutes } from "date-fns";

export const loginController = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;
    const foundUser = await User.findOne({ where: { email } });

    if (!foundUser)
      return res.status(404).json({ message: "User does not exist" });

    const passwordMatch = bcrypt.compareSync(password, foundUser.password);
    if (!passwordMatch)
      return res.status(401).json({ message: "Unauthorized" });

    if (!foundUser.verified) {
      const existingToken = await Token.findOne({
        where: { userId: foundUser.id },
      });
      await existingToken?.destroy();

      const verificationToken = await Token.create({
        userId: foundUser.id!,
        token: crypto.randomBytes(32).toString("hex"),
      });

      const url = `${process.env.FRONTEND_URL}/auth/${foundUser.id}/verify/${verificationToken.token}`;

      await sendMail(foundUser.email, "Verify email", url);

      return res
        .status(400)
        .json({ message: "Email sent to your account please verify" });
    }

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

export const registerController = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(409).json({ message: "Email already in use" });
    const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));

    const newUser = await User.create({
      email,
      name,
      password: hashedPassword,
      verified: false,
    });

    if (!newUser)
      return res.status(400).json({ message: "Invalid data recieved!" });

    // verification token
    const verificationToken = await Token.create({
      userId: newUser.id!,
      token: crypto.randomBytes(32).toString("hex"),
    });

    const url = `${process.env.FRONTEND_URL}/auth/${newUser.id!}/verify/${
      verificationToken.token
    }`;
    // send the verification url via email
    await sendMail(newUser.email, "Verify email", url);
    res
      .status(201)
      .json({ message: "Email sent to your account please verify" });
  }
);

export const logoutController = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); //no content;
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ message: "Cookie cleared" });
  }
);

export const verifyController = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { userId, token } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(400).send({ message: "Invalid link" });
    const existingToken = await Token.findOne({
      where: {
        userId,
        token,
      },
    });

    if (!existingToken)
      return res.status(400).send({ message: "invalid link" });
    user.verified = true;
    await user.save();
    await existingToken.destroy();
    res.status(200).send({ message: "Email verified successfully!" });
  }
);

export const forgotPasswordController = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { email } = req.body;
    console.log(email)
     const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found!" });
    const existingToken = await Token.findOne({ where: { userId: user.id } });
    await existingToken?.destroy();

    const otp = await Token.create({
      token: crypto.randomBytes(32).toString("hex"),
      userId: user.id!,
    });

    const url = `${process.env.FRONTEND_URLL}/auth/reset/${otp.token}`;

    // send the verification url via email
    await sendMail(user.email, "Reset Password", url);
    return res
      .status(200)
      .json({ message: "Recovery mail sent successfully!" });
  }
);

export const restPasswordController = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { token } = req.params;
    const { password } = req.body;
    const existingToken = await Token.findOne({ where: { token } });
    if (!existingToken)
      return res.status(400).send({ message: "invalid link" });

    // before reset check how long token has stayed
    const tokenExpiry: number =
      Number(process.env.TOKEN_EXPIRY_IN_MINUTES) || 10;
    if (
      differenceInMinutes(new Date(), existingToken.createdAt!) > tokenExpiry
    ) {
      existingToken.destroy();
      return res.status(405).json({ message: "Token already expired" });
    }

    const user = await User.findByPk(existingToken.userId);

    if (user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
    }

    await existingToken.destroy();
    return res.status(200).json({ message: "password updated successfully!" });
  }
);

export const refreshController = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(403).json({ message: "Unauthorized" });
    const refreshToken = cookies.jwt;
    // verify the refresh token
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
      async (error: any, decoded: any) => {
        if (error) return res.status(403).json({ message: "Forbidden" });
        const foundUser = await User.findOne({
          where: { email: decoded?.email },
        });
        if (!foundUser)
          return res.status(400).json({ message: "Unauthorized" });
        // create the access token
        const accessToken = jwt.sign(
          {
            UserInfo: {
              email: foundUser.email,
              userId: foundUser.id,
            },
          },
          process.env.ACCESS_TOKEN_SECRET as string,
          { expiresIn: "1h" }
        );
        return res.json({ accessToken });
      }
    );
  }
);
