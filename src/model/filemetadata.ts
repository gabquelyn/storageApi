import { Model, DataTypes } from "sequelize";
import sequelize from "../utils/database";
import { FileMetaDataAttribute } from "../../types";
interface FileMetaDataInstance
  extends Model<FileMetaDataAttribute>,
    FileMetaDataAttribute {}
const FileMetaData = sequelize.define<FileMetaDataInstance>("Filemetadata", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  originalname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  folderId: {
    type: DataTypes.INTEGER,
    defaultValue: -1
  },
  mimetype: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default FileMetaData;
