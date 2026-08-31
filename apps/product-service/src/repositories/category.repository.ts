import { Category, ICategory } from "../models/category.model";

export class CategoryRepository {
  async findByName(name: string) {
    return await Category.findOne({ name: name.toLowerCase().trim() });
  }

  async create(categoryData: Partial<ICategory>) {
    return await Category.create(categoryData);
  }

  async findAll() {
    return await Category.find().sort({ createdAt: -1 });
  }

  async findById(categoryId: string) {
    return await Category.findById(categoryId);
  }

  async update(categoryId: string, categoryData: Partial<ICategory>) {
    return await Category.findByIdAndUpdate(categoryId, categoryData, {
      returnDocument: "after",
    });
  }

  async delete(categoryId: string) {
    return await Category.findByIdAndDelete(categoryId);
  }
}
