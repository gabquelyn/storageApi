import sequelize from "../utils/database";
import { DataTypes, Model } from "sequelize";
import { TokenAttributes } from "../../types";

interface TokenInstance extends Model<TokenAttributes>, TokenAttributes {}
const token = sequelize.define<TokenInstance>("Token", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default token;
