import { Response, Request } from "express";
import expressAsyncHandler from "express-async-handler";
export const loginController = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const {email, password} = req.body;
    
  }
);

export const registerController = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {}
);

export const logoutController = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {}
);

export const verifyController = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {}
);
