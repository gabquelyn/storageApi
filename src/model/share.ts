import sequelize from "../utils/database";
import { DataTypes, Model } from "sequelize";
import { linkAttributes } from "../../types";

interface ShareInstance extends Model<linkAttributes>, linkAttributes {}
const share = sequelize.define<ShareInstance>("Share", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
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
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: "folder",
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

export default share;
