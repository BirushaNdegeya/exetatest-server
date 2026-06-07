import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Item } from './item.model';

interface ItemCourseCreationAttributes {
  course: string;
  item_id: string;
  passage?: string | null;
}

@Table({
  tableName: 'item_courses',
  timestamps: true,
})
export class ItemCourse extends Model<
  ItemCourse,
  ItemCourseCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
  })
  declare course: string;

  @ForeignKey(() => Item)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare item_id: string;

  @BelongsTo(() => Item)
  declare item: Item;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare passage: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare updatedAt: Date;
}
