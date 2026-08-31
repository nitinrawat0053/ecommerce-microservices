import { ConflictError, NotFoundError } from "@packages/errors";
import { CategoryRepository } from "../repositories/category.repository";

const categoryRepository = new CategoryRepository();

export class CategoryService {
  async createCategory(name: string, description?: string, icon?: string) {
    const existing = await categoryRepository.findByName(name);
    if (existing) {
      throw new ConflictError(`Category "${name.trim()}" already exists`);
    }

    return await categoryRepository.create({
      name: name.trim().toLowerCase(),
      description,
      icon,
    });
  }

  async getAllCategories() {
    return await categoryRepository.findAll();
  }

  async getCategoryById(categoryId: string) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    return category;
  }

  async updateCategory(categoryId: string, data: any) {
    const exists = await categoryRepository.findById(categoryId);
    if (!exists) {
      throw new NotFoundError("Category not found");
    }

    if (data.name) {
      const duplicate = await categoryRepository.findByName(data.name);
      if (duplicate && duplicate._id.toString() !== categoryId) {
        throw new ConflictError(`Category "${data.name.trim()}" already exists`);
      }
      data.name = data.name.trim().toLowerCase();
    }

    return await categoryRepository.update(categoryId, data);
  }

  async deleteCategory(categoryId: string) {
    const category = await categoryRepository.delete(categoryId);
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    return category;
  }
}
