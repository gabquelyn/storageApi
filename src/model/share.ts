import sequelize from "../utils/database";
import { DataTypes, Model } from "sequelize";
import { linkAttributes } from "../../types";

interface ShareInstance extends Model<linkAttributes>, linkAttributes {}
const share = sequelize.define<ShareInstance>("Token", {
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
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: "folder",
    allowNull: false,
  },
  itemId: {
    type: DataTypes.NUMBER,
    allowNull: false,
  },
});

export default share;
