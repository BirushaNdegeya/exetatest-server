import {
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { ItemCourse } from './item-course.model';

export enum ItemTypeEnum {
  CULTURE_GENERALE = 'cg',
  SCIENCES = 'sc',
  COURS_OPTIONS = 'co',
  LANGUES = 'la',
}

interface ItemCreationAttributes {
  type: ItemTypeEnum;
  section_id: string;
  year: number;
  universal?: boolean;
}

@Table({
  tableName: 'items',
  timestamps: true,
})
export class Item extends Model<Item, ItemCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.ENUM(...Object.values(ItemTypeEnum)),
    allowNull: false,
  })
  declare type: ItemTypeEnum;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare section_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare year: number;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare universal: boolean;

  @HasMany(() => ItemCourse)
  declare courses: ItemCourse[];

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
