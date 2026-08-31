import { Brand, IBrand } from "../models/brand.model";

export class BrandRepository {
  async findByName(name: string) {
    return await Brand.findOne({ name: name.toLowerCase().trim() });
  }

  async create(brandData: Partial<IBrand>) {
    return await Brand.create(brandData);
  }

  async findAll() {
    return await Brand.find().sort({ createdAt: -1 });
  }

  async findById(brandId: string) {
    return await Brand.findById(brandId);
  }

  async update(brandId: string, brandData: Partial<IBrand>) {
    return await Brand.findByIdAndUpdate(brandId, brandData, {
      returnDocument: "after",
    });
  }

  async delete(brandId: string) {
    return await Brand.findByIdAndDelete(brandId);
  }
}
