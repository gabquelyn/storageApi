import { Model, DataTypes } from "sequelize";
import sequelize from "../utils/database";
import { FolderMetaDataAttribute } from "../../types";
interface FolderMetaDataInstance
  extends Model<FolderMetaDataAttribute>,
    FolderMetaDataAttribute {}
const FolderMetaData = sequelize.define<FolderMetaDataInstance>("File", {
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
  foldername: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default FolderMetaData;
