import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { ItemCourse } from './item-course.model';

interface ItemQuestionCreationAttributes {
  question: string;
  item_course_id: string;
  options: string[];
  answer: number;
}

@Table({
  tableName: 'item_questions',
  timestamps: true,
})
export class ItemQuestion extends Model<
  ItemQuestion,
  ItemQuestionCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare question: string;

  @ForeignKey(() => ItemCourse)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare item_course_id: string;

  @BelongsTo(() => ItemCourse)
  declare itemCourse: ItemCourse;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
  })
  declare options: string[];

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare answer: number;

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
