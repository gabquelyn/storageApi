import sequelize from "../utils/database";
import { DataTypes, Model } from "sequelize";
import { SubscriptionAttributes } from "../../types";

interface SubscriptionInstance
  extends Model<SubscriptionAttributes>,
    SubscriptionAttributes {}
const subscription = sequelize.define<SubscriptionInstance>("Subscription", {
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
  subscriptionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subscriptionItemId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

export default subscription;
