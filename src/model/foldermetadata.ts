import { Model, DataTypes } from "sequelize";
import sequelize from "../utils/database";
import { FolderMetaDataAttribute } from "../../types";
interface FolderMetaDataInstance
  extends Model<FolderMetaDataAttribute>,
    FolderMetaDataAttribute {}
const FolderMetaData = sequelize.define<FolderMetaDataInstance>("Foldermetadata", {
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
  totalSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  foldername: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
});

export default FolderMetaData;
